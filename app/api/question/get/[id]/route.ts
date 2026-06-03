import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: { Source: true },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }

    // Get sources and sub-questions of question concurrently
    const [questions, sources] = await Promise.all([
      prisma.question.findMany({ where: { topicId: question.id } }),
      prisma.source.findMany({ where: { questionId: question.id } }),
    ]);

    return NextResponse.json(
      {
        ...question,
        type: 'question',
        questions: questions.map((q) => ({ ...q, type: 'question' })),
        sources: sources.map((s) => ({ ...s, type: 'source' })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get question.' }, { status: 500 });
  }
}
