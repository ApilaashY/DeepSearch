import { Logger } from '@/lib/logger';
import { ParentNotFound } from '@/lib/operations/topic/getTopic';
import { addQuestion } from '@/lib/operations/question/addQuestion';
import { NextRequest, NextResponse } from 'next/server';

const logger = new Logger('Add Question API');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { parentId, title, isTopicParent } = body;

    // Create the new question
    try {
      const question = await addQuestion(title, parentId, isTopicParent);
      return NextResponse.json({ id: question, type: 'question' }, { status: 200 });
    } catch (e) {
      if (e instanceof ParentNotFound) {
        logger.error(`Parent not found.`, { title, parentId, error: e });
        return NextResponse.json({ error: 'Parent not found.' }, { status: 404 });
      }
    }
  } catch (error) {
    logger.error(`Failed to create question.`, { error });
    return NextResponse.json({ error: 'Failed to create question.' }, { status: 500 });
  }
}
