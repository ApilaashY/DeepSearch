import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(body);

    const topic = await prisma.topic.create({ data: body });

    return NextResponse.json(topic);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create topic." },
      { status: 500 },
    );
  }
}
