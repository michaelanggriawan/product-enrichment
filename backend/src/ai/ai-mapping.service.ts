import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiMappingService {
  private openai = new OpenAI({
    apiKey: process.env.OPEN_API_KEY,
  });

async generateColumnMapping(headers: string[]): Promise<Record<string, string>> {
    const prompt = `You are a smart assistant helping map CSV column names to standard fields in a product upload system.

Your job is to look at the given CSV headers and guess which column represents the following product fields:
- product name = (product title or product name)
- brand
- barcode
- images (URL or image-related column)

Do your best to identify based on your observation of the column names.

Given these headers: ${JSON.stringify(headers)}
Return only a raw JSON object mapping CSV columns to known field names. If a column doesn't match, return null.

Example:
{"name": "product name", "brand": "brand", "barcode": "barcode", "image": "images"}`;


    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices[0].message.content?.trim() || '{}';
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.slice(jsonStart, jsonEnd);

    return JSON.parse(jsonString);
  }
}
