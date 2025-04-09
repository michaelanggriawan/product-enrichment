import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: { uploadId: string } }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${params.uploadId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
