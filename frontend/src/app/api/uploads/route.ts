import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  try {
    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads`, {
      method: 'POST',
      body: formData,
    });

    const result = await uploadRes.json();

    if (!uploadRes.ok) {
      // Forward detailed error message from the backend
      console.log('debug result', result.errors[0].message);
      return NextResponse.json(
        {
          error: result.message || result.errors[0].message || 'Upload failed due to server error.',
        },
        { status: uploadRes.status }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unexpected error during file upload.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  const fileName = searchParams.get('fileName') || '';

  const query = new URLSearchParams({
    page,
    limit,
  });

  if (fileName) {
    query.append('fileName', fileName);
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads?${query.toString()}`, {
      method: 'GET',
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to fetch uploads:', err);
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }
}
