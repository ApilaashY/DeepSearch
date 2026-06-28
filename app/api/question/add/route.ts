import { addQuestion } from '@/lib/operations/question/addQuestion';
import { TopicNotFound } from '@/lib/operations/topic/getTopic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { parentId, title } = body;

    // Create the new question
    try {
      const question = await addQuestion(title, parentId);
      return NextResponse.json({ id: question, type: 'question' }, { status: 200 });
    } catch (e) {
      if (e instanceof TopicNotFound) {
        return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
      }
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create question.' }, { status: 500 });
  }
}
