import { prisma } from '@/lib/prisma';

export class ParentNotFound extends Error {}

export async function getTopic(topidId: string) {
  const topic = await prisma.topic.findUnique({ where: { id: topidId } });

  if (!topic) {
    throw new ParentNotFound();
  }

  return topic;
}
