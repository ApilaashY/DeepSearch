import { ParentNotFound } from '@/lib/operations/topic/getTopic';
import { prisma } from '@/lib/prisma';

export async function addQuestion(
  title: string,
  topicId: string,
  parentQuestionId?: string
): Promise<string> {
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) {
    throw new ParentNotFound();
  }

  if (parentQuestionId) {
    const parentQuestion = await prisma.question.findUnique({ where: { id: parentQuestionId } });
    if (!parentQuestion) {
      throw new ParentNotFound();
    }
  }

  const question = await prisma.question.create({
    data: { title: title, topicId: topicId, parentId: parentQuestionId ?? null },
  });
  return question.id;
}
