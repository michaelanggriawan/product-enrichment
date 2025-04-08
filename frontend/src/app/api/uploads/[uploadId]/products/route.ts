import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: { uploadId: string } }) {
  const body = await req.json();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.uploadId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const result = await res.json();
  return NextResponse.json(result, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: { uploadId: string } }) {
  const p = await params;
  const uploadId = p.uploadId;
  const searchParams = new URL(req.url).searchParams;

  const queryParams = new URLSearchParams(searchParams).toString();

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/uploads/${uploadId}/products?${queryParams}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
