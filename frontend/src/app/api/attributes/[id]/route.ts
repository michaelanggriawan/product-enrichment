import { NextResponse, NextRequest } from 'next/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/attributes/${id}`;

  const res = await fetch(backendUrl, { method: 'DELETE' });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: res.status });
  }

  return new Response(JSON.stringify({ message: `Deleted ${id}` }), {
    status: 200,
  });
}
