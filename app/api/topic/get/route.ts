import { NextResponse } from 'next/server';
import { getAllTopics } from '@/lib/operations/topic/getAllTopics';
import { getTopic } from '@/lib/operations/topic/getTopic';
import { Logger } from '@/lib/logger';

const logger = new Logger('Topic Get API Route');

export async function GET() {
  try {
    // Get all topics from DB
    // TODO: MAKE THIS AUTHENTICATED TO ONLY TAKE USER'S TOPICS
    const userId = '';
    const topics = await getAllTopics(userId);
    const topicData = [];

    for (const id of topics) {
      try {
        const topic = await getTopic(id);

        topicData.push(topic);
      } catch (error) {
        logger.error(`Failed to get topic with id: ${id}`, { id, error });
      }
    }

    return NextResponse.json(topicData || []);
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Failed to get topics.' }, { status: 500 });
  }
}
