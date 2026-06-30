import { prisma } from '@/lib/prisma';
import { getTopicAIPending, ItemNotFound } from '../topic/getTopic';

export async function getSource(sourceId: string) {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });

  if (!source) {
    throw new ItemNotFound();
  }

  return { ...source, ai_pending: await getTopicAIPending(source.topicId) };
}
