import { prisma } from '@/lib/prisma';

export async function addSummaryWorkflow(id: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`
            SELECT graphile_worker.add_job(
              identifier => ${'summary-research'},
              payload => ${JSON.stringify({ topicId: id })},
              max_attempts => 1
            );
          `;
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
