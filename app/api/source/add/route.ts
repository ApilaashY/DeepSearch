import { addSource } from '@/lib/operations/source/addSource';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { parentId, title } = body;

    if (!parentId || typeof parentId !== 'string') {
      return NextResponse.json({ error: 'Parent id is required.' }, { status: 400 });
    }

    const source = await addSource(title, parentId);

    return NextResponse.json({ source }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create source.' }, { status: 500 });
  }
}
