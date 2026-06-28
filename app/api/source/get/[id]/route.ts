import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const source = await prisma.source.findUnique({ where: { id: id } });

    if (!source) {
      return NextResponse.json({ error: 'Source not found.' }, { status: 404 });
    }

    return NextResponse.json(
      {
        source: {
          ...source,
          url: source.url ?? '',
          summary: source.summary ?? '',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get source.' }, { status: 500 });
  }
}
