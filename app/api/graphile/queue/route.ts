import { addSummaryWorkflow } from '@/lib/operations/graphile/addSummaryWorkflow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    await addSummaryWorkflow(id);

    return NextResponse.json({ success: true, message: 'Queued Job' }, { status: 200 });
  } catch (error) {
    console.error('Failed to queue job:', error);
    return NextResponse.json({ success: false, error: 'Failed to queue job' }, { status: 500 });
  }
}
