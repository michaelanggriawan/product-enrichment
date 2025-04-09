import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { uploadId: string } }) {
  const { uploadId } = params;

  try {
    const body = await req.json();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/uploads/${uploadId}/products/enrich`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    console.log('debug data', data);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error enriching products:', error);
    return NextResponse.json({ error: 'Failed to enrich products' }, { status: 500 });
  }
}
