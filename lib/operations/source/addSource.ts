import { prisma } from '@/lib/prisma';
import { TopicNotFound } from '../topic/getTopic';

export async function addSource(title: string, parentId: string): Promise<string> {
  const topic = await prisma.topic.findUnique({ where: { id: parentId } });
  if (!topic) {
    throw new TopicNotFound();
  }
  const source = await prisma.source.create({ data: { title, topicId: parentId } });
  return source.id;
}
