import { prisma } from '@/lib/prisma';

export async function updateQuestion(id: string, data: { title?: string; description?: string }) {
  try {
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data,
    });

    await prisma.$disconnect();
    return updatedQuestion;
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}
