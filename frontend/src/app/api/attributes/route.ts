import { NextResponse, NextRequest } from 'next/server';

import { z } from 'zod';

const attributeSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'short_text',
    'long_text',
    'rich_text',
    'number',
    'single_select',
    'multiple_select',
    'measure',
  ]),
  unit: z.string().nullable().optional(),
  options: z.array(z.string()).nullable().optional(),
});

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attributes`, {
      method: 'GET',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch attributes' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = attributeSchema.parse(body);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attributes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to create attribute' },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
