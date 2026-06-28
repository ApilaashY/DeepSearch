import { prisma } from '@/lib/prisma';

export async function addTopic(body: { name: string; description: string }) {
  const topic = await prisma.topic.create({
    data: {
      name: body.name,
      description: body.description,
    },
  });
  return topic;
}
