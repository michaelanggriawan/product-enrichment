import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';

const DEFAULT_ERROR_MESSAGE =
  'Something went wrong on our end, please try again';

type RequestData = {
  method: string;
  url: string;
  headers: Headers;
  body: ReadableStream<Uint8Array>;
};

type ResponseData = {
  statusCode: number;
  success: boolean;
  errors: any;
};

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  logError(
    status: number,
    errorMessage: any,
    requestData: RequestData,
    responseData: ResponseData,
  ) {
    this.logger.error(
      `Error occurred during ${requestData.method} request to ${
        requestData.url
      }. Error: ${JSON.stringify(responseData)}`,
    );
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (!exception || typeof exception.getStatus !== 'function') {
      return response.status(500).json({
        statusCode: 500,
        success: false,
        errors: [{ message: DEFAULT_ERROR_MESSAGE }],
      });
    }

    const status = exception.getStatus() as number;

    const errorMessage =
      exception.getResponse()?.message ||
      exception.message ||
      DEFAULT_ERROR_MESSAGE;

    const requestData = {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
    };

    const responseData = {
      statusCode: status,
      success: false,
      errors: exception.getResponse()?.errors || [{ message: errorMessage }],
    };

    this.logError(status, errorMessage, requestData, responseData);

    let handleErrorMessageResponse = [];
    if (typeof errorMessage === 'string') {
      handleErrorMessageResponse = [{ message: errorMessage }];
    } else if (Array.isArray(errorMessage)) {
      handleErrorMessageResponse = errorMessage.map((message) => {
        return { message };
      });
    }

    response.status(status).json({
      statusCode: status,
      success: false,

      errors: exception.getResponse()?.errors ?? handleErrorMessageResponse,
    });
  }
}