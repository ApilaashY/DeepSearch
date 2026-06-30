import { getQuestion } from '@/lib/operations/question/getQuestion';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const question = await getQuestion(id);

    return NextResponse.json({ question }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get question.' }, { status: 500 });
  }
}
