import { prisma } from '@/lib/prisma';

export async function getAllTopics(userId: string): Promise<string[]> {
  void userId;

  const topics = await prisma.topic.findMany({
    where: {
      //   userId,
    },
    select: {
      id: true,
    },
  });

  return topics.map((t: { id: string }) => t.id);
}
