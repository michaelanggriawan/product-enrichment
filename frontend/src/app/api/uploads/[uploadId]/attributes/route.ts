import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  attributeIds: z.array(z.string()),
});

export async function POST(req: NextRequest, { params }: { params: { uploadId: string } }) {
  const uploadId = params.uploadId;
  const json = await req.json();

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { attributeIds } = parsed.data;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${uploadId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attributeIds }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.error }, { status: 500 });
  }

  return NextResponse.json({ message: 'Attributes saved' });
}
