import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { GET as getTopic } from "./[id]/route";

export async function GET(request: NextRequest) {
  try {
    // Get all topics from DB
    // TODO: MAKE THIS AUTHENTICATED TO ONLY TAKE USER'S TOPICS
    const topics = await prisma.topic.findMany({select: { id: true }})
    const topicData = [];

    for (let topic of topics) {
      // Check if the id is for a topic or question/source
      const top = await prisma.topic.findUnique({where: {id: topic.id}})

      if (!top) {
        return NextResponse.json(
          { error: "Topic not found." },
          { status: 404 },
        );
      }

      // Get questions of topic
      const questions = await prisma.question.findMany({where: {topicId: topic.id}})

      topicData.push({ ...top, questions: questions.map((q) => ({ ...q, type: "question" })), type: "topic" })
    }


    return NextResponse.json(topicData || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get topics." },
      { status: 500 },
    );
  }
}
