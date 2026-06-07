import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId, userEmail, actionType } = await req.json();

  await prisma.$executeRaw`
      SELECT graphile_worker.add_job(
        identifier => ${'process-user-action'}, 
        payload => ${JSON.stringify({ id: userId, email: userEmail, action: actionType })}
      );
    `;

  return new Response('Queued Job', { status: 200 });
}
