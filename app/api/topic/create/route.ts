import { addTopic } from '@/lib/operations/topic/addTopic';
import { Logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

const logger = new Logger('Topic Create API Route');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description = '', ...extras } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (extras !== undefined || Object.keys(extras).length > 0) {
      logger.warn('Ignoring extra parameters', extras);
    }

    const topic = await addTopic({ name: name.trim(), description: description.trim() });

    return NextResponse.json(topic);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create topic.' }, { status: 500 });
  }
}
