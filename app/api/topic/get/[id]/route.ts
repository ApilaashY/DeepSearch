import { getTopic } from '@/lib/operations/topic/getTopic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const topic = await getTopic(id);

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get topics.' }, { status: 500 });
  }
}
