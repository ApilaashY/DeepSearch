import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { parentId, title } = body;

    if (!parentId || typeof parentId !== 'string') {
      return NextResponse.json({ error: 'Parent id is required.' }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({ where: { id: parentId } });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }

    // Create the new source
    const source = await prisma.source.create({ data: { title, topicId: parentId } });

    return NextResponse.json({ id: source.id, type: 'source' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create source.' }, { status: 500 });
  }
}
