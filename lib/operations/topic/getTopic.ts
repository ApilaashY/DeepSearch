import { prisma } from '@/lib/prisma';

export class ParentNotFound extends Error {}
export class ItemNotFound extends Error {}

export async function getTopic(
  topidId: string,
  only?: { description?: boolean; questions?: boolean; sources?: boolean }
) {
  if (only !== undefined) {
    const { questions: _, sources: __, ...prismaOnly } = only;
    void _;
    void __;

    let topic;

    if (Object.keys(prismaOnly).length !== 0) {
      topic = await prisma.topic.findUnique({ where: { id: topidId }, select: prismaOnly });

      if (!topic) {
        throw new ItemNotFound();
      }
    }

    const [questions, sources] = await Promise.all([
      only.questions && prisma.question.findMany({ where: { topicId: topidId } }),
      only.sources && prisma.source.findMany({ where: { topicId: topidId } }),
    ]);

    await prisma.$disconnect();
    return { ...topic, ...(only.questions && { questions }), ...(only.sources && { sources }) };
  } else {
    const topic = await prisma.topic.findUnique({ where: { id: topidId } });

    if (!topic) {
      throw new ItemNotFound();
    }

    const [questions, sources] = await Promise.all([
      prisma.question.findMany({ where: { topicId: topidId } }),
      prisma.source.findMany({ where: { topicId: topidId } }),
    ]);

    await prisma.$disconnect();
    return { ...topic, questions, sources };
  }
}
