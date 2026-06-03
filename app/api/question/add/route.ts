import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { parentId, title } = body;

    // Create the new question
    const question = await prisma.question.create({ data: { title: title, topicId: parentId } });

    return NextResponse.json({ id: question.id, type: 'question' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create question.' }, { status: 500 });
  }
}
