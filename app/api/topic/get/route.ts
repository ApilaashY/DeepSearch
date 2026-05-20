import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get all topics from DB
    // TODO: MAKE THIS AUTHENTICATED TO ONLY TAKE USER'S TOPICS
    const topics = await prisma.topic.findMany();

    return NextResponse.json(topics[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get topics." },
      { status: 500 },
    );
  }
}
