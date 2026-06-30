import { prisma } from '@/lib/prisma';
import { getTopic } from './getTopic';

export async function updateTopic(
  id: string,
  data: { name?: string; description?: string; summary?: string; ai_pending?: boolean }
) {
  try {
    const updatedTopic = await prisma.topic.update({
      where: { id },
      data: {
        ...data,
      },
    });

    const { questions, sources } = await getTopic(id, { questions: true, sources: true });

    await prisma.$disconnect();
    return { ...updatedTopic, questions, sources };
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}
