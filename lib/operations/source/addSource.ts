import { prisma } from '@/lib/prisma';
import { ParentNotFound } from '../topic/getTopic';

export async function addSource(title: string, parentId: string) {
  const topic = await prisma.topic.findUnique({ where: { id: parentId } });

  if (!topic) {
    throw new ParentNotFound();
  }

  const source = await prisma.source.create({ data: { title, topicId: parentId } });
  return source;
}
