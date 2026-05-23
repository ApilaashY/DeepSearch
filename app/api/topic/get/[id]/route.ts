import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    
    // Check if the id is for a topic or question/source
    const topic = await prisma.topic.findUnique({where: {id: id}})

    if (!topic) {
        return NextResponse.json(
            { error: "Topic not found." },
            { status: 404 },
        );
    }

    // Get questions of topic
    const questions = await prisma.question.findMany({where: {topicId: id}})
    
    return NextResponse.json({ ...topic, questions: questions.map((q) => ({ ...q, type: "question" })), type: "topic" }, {status: 200});
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get topics." },
      { status: 500 },
    );
  }
}