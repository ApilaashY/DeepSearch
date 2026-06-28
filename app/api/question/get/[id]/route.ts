import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const question = await prisma.question.findUnique({ where: { id } });

    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }

    // Get the sub questions
    const subQuestions = await prisma.question.findMany({
      select: {
        id: true,
        title: true,
        description: true,
      },
      where: {
        parentId: id,
      },
    });

    return NextResponse.json(
      {
        question: {
          ...question,
          questions: subQuestions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get question.' }, { status: 500 });
  }
}
