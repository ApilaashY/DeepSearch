import { updateTopic } from '@/lib/operations/topic/updateTopic';
import { Logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

const logger = new Logger('Topic Update API Route');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, description = '', ...extras } = body;

    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    if (extras !== undefined || Object.keys(extras).length > 0) {
      logger.warn('Ignoring extra parameters', extras);
    }

    const topic = await updateTopic(id, { description: description.trim() });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update topic.' }, { status: 500 });
  }
}
