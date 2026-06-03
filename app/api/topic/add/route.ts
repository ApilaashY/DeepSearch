import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(body);

    const { id, type, data } = body;

    const underscoreIndex = id.indexOf('_');

    if (underscoreIndex === -1) {
      return NextResponse.json({ error: 'Invalid route id.' }, { status: 400 });
    }

    const parentType = id.slice(0, underscoreIndex);
    const parentId = id.slice(underscoreIndex + 1);
    let parentQuestion: string | undefined = undefined;

    if (parentType === 'topic') {
      const topic = await prisma.topic.findUnique({ where: { id: parentId } });

      if (!topic) {
        return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
      }

      parentQuestion = topic.id;
    } else if (parentType === 'question') {
      const question = await prisma.question.findUnique({ where: { id: parentId } });

      if (!question) {
        return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
      }

      parentQuestion = question.id;
    } else {
      return NextResponse.json({ error: 'Unsupported parent route.' }, { status: 400 });
    }

    // Create the new question/source
    if (type === 'question') {
      const question = await prisma.question.create({
        data: {
          title: data.title,
          topicId: parentQuestion,
        },
      });

      return NextResponse.json({ id: question.id, type: 'question' }, { status: 200 });
    } else {
      const source = await prisma.source.create({
        data: {
          title: data.title,
          questionId: parentQuestion,
        },
      });

      return NextResponse.json({ id: source.questionId, type: 'source' }, { status: 200 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create topic.' }, { status: 500 });
  }
}
