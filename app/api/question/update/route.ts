import { updateQuestion } from '@/lib/operations/question/updateQuestion';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Question id is required.' }, { status: 400 });
    }

    const updatedQuestion = await updateQuestion(id, {
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
    });

    return NextResponse.json({ question: updatedQuestion }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update question.' }, { status: 500 });
  }
}
