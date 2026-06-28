import { prisma } from '@/lib/prisma';

export class ParentNotFound extends Error {}
export class ItemNotFound extends Error {}

export async function getTopic(topidId: string) {
  const topic = await prisma.topic.findUnique({ where: { id: topidId } });

  if (!topic) {
    throw new ItemNotFound();
  }

  const [questions, sources] = await Promise.all([
    prisma.question.findMany({ where: { topicId: topidId } }),
    prisma.source.findMany({ where: { topicId: topidId } }),
  ]);

  return { ...topic, questions, sources };
}
