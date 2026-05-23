import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(body);

    const {id, type, data} = body;

    // Split the id
    const rootId = id.split("/")[0];
    const nestedPath = id.split("/").slice(1);
    let parentQuestion: string | undefined = undefined;
    let parentCount: number = 0;

    // Find the topic/questions in the database
    if (nestedPath.length === 0) {
      const topic = await prisma.topic.findUnique({ where: { id: rootId } });

      if (!topic) {
        return NextResponse.json(
          { error: "Topic not found." },
          { status: 404 },
        );
      }

      parentQuestion = topic.id;
      parentCount = topic.count;
    } else {
        let item = undefined;

        for (const index of nestedPath) {
            item = await prisma.question.findMany({where: {topicId: rootId, index: parseInt(index)}})

            if (item === undefined) {
                return NextResponse.json(
                    { error: "Topic not found." },
                    { status: 404 },
                );
            }
            item = item[0];
        }

        if (item === undefined) {
            return NextResponse.json(
                { error: "Topic not found." },
                { status: 404 },
            );
        }

        parentQuestion = item.id;
        parentCount = item.count;
    }


    // Create the new question/source
    if (type === "question") {
        const question = await prisma.question.create({
            data: {
                title: data.title,
                index: parentCount,
                topicId: parentQuestion,
            }
        });

        return NextResponse.json({index: question.index + ""}, {status: 200});
    } else {
        const source = await prisma.source.create({
            data: {
                title: data.title,
                index: parentCount,
                questionId: parentQuestion,
            }
        });

        return NextResponse.json({index: source.index + ""}, {status: 200});
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create topic." },
      { status: 500 },
    );
  }
}
