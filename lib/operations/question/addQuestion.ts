import { ParentNotFound } from '@/lib/operations/topic/getTopic';
import { prisma } from '@/lib/prisma';

export async function addQuestion(
  title: string,
  parentId: string,
  isTopic: boolean
): Promise<string> {
  if (isTopic) {
    const topic = await prisma.topic.findUnique({ where: { id: parentId } });
    if (!topic) {
      throw new ParentNotFound();
    }
  } else {
    const question = await prisma.question.findUnique({ where: { id: parentId } });
    if (!question) {
      throw new ParentNotFound();
    }
  }

  const question = await prisma.question.create({ data: { title: title, parentId: parentId } });
  return question.id;
}
