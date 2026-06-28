import { prisma } from '@/lib/prisma';

export async function addSummaryWorkflow(params: Record<string, unknown>): Promise<boolean> {
  try {
    await prisma.$executeRaw`
            SELECT graphile_worker.add_job(
              identifier => ${'process-user-action'}, 
              payload => ${JSON.stringify(params)}
            );
          `;
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
