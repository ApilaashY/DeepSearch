import { NextRequest, NextResponse } from 'next/server';
import { getSource } from '@/lib/operations/source/getSource';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const source = await getSource(id);

    if (!source) {
      return NextResponse.json({ error: 'Source not found.' }, { status: 404 });
    }

    return NextResponse.json({ source }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get source.' }, { status: 500 });
  }
}
