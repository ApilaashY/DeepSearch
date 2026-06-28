import { prisma } from '@/lib/prisma';
import { TopicNotFound } from '../topic/getTopic';

export async function addQuestion(title: string, parentId: string): Promise<string> {
  const topic = await prisma.topic.findUnique({ where: { id: parentId } });
  if (!topic) {
    throw new TopicNotFound();
  }

  const question = await prisma.question.create({ data: { title: title, topicId: parentId } });
  return question.id;
}
