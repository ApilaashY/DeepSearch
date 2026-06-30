import { prisma } from '@/lib/prisma';
import { getTopicAIPending, ItemNotFound } from '../topic/getTopic';

export async function getQuestion(questionId: string) {
  const question = await prisma.question.findUnique({ where: { id: questionId } });

  if (!question) {
    throw new ItemNotFound();
  }

  const subQuestions = await prisma.question.findMany({ where: { parentId: questionId } });

  return {
    ...question,
    questions: subQuestions,
    ai_pending: await getTopicAIPending(question.topicId || ''),
  };
}
