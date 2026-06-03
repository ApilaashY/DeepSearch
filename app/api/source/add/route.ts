import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { parentId, title } = body;

    // Create the new source
    const source = await prisma.source.create({ data: { title: title, parentId: parentId } });

    return NextResponse.json({ id: source.id, type: 'source' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create source.' }, { status: 500 });
  }
}
