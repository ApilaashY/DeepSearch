import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, actionType } = await req.json();

    await prisma.$executeRaw`
        SELECT graphile_worker.add_job(
          identifier => ${'process-user-action'}, 
          payload => ${JSON.stringify({ id: userId, email: userEmail, action: actionType })}
        );
      `;

    return NextResponse.json({ success: true, message: 'Queued Job' }, { status: 200 });
  } catch (error) {
    console.error('Failed to queue job:', error);
    return NextResponse.json({ success: false, error: 'Failed to queue job' }, { status: 500 });
  }
}
