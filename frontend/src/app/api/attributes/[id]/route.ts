import { NextResponse, NextRequest } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/attributes/${params.id}`;

  const res = await fetch(backendUrl, {
    method: 'DELETE',
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: res.status });
  }

  return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
}
