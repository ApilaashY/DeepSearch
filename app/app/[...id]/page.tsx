"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { useEffect, useState } from "react";
import {
  Topic,
  Question,
  Source,
} from "@/lib/redux/slices/topicSlice";

export default function IdPage() {
  const params = useParams();
  const router = useRouter();

  // In a catch-all route like [...id], params.id is an array of strings.
  // Example for URL /app/123/0/2/1 -> params.id = ["123", "0", "2", "1"]
  const idArray = params.id as string[];
  const rootTopicId = idArray[0];
  const nestedPath = idArray.slice(1); // e.g. ["0", "2", "1"]

  const topics = useAppSelector((state) => state.topics.topics);
  const [data, setData] = useState<Topic | Question | Source | undefined>();
  const [addingQ, setAddingQ] = useState<boolean>(false);

  // Find current topic using the nested path
  useEffect(() => {
    // 1. Find the root topic using the first part of the URL
    let currentTopic: Topic | Question | Source | undefined = topics.find(
      (t) => t.id === rootTopicId,
    );

    // 2. TODO: Use `nestedPath` (e.g. ["0", "2", "1"]) to traverse
    // down `currentTopic.questions` to find the specific nested
    // question or source you are currently viewing!
    for (const index of nestedPath) {
      if (currentTopic === undefined) break;

      currentTopic =
        (currentTopic as Topic | Question).questions?.[parseInt(index)] ??
        undefined;
    }
    setData(currentTopic);
  }, [topics, rootTopicId]);

  // Check if topic exists or not
  if (data === undefined) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <h1>Topic not found</h1>
      </div>
    );
  }

  const addQuestion = async (isQuestion: boolean) => {
    if (data === undefined) return;
    if (data.type === "source") return;

    const question = prompt(
      `What is the ${isQuestion ? "Question" : "Source"} you want to add?`,
    );

    if (question === null || question.trim() === "") return;

    const result = await fetch("/api/topic/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: idArray.join("/"),
        type: isQuestion ? "question" : "source",
        data: { title: question },
      }),
    });

    if (!result.ok) {
      alert("Failed to add question/source.");
      return;
    }

    setAddingQ(false);

    const { index } = await result.json();

    router.push("/app/" + idArray.join("/") + "/" + index);
  };

  console.log(data);

  if (data.type === "topic") {
    const topic = data as Topic;
    return (
      // Topic View
      <div className="flex flex-col p-6 gap-4 color-white">
        <div className="flex flex-row justify-between">
          <h1 className="text-2xl font-semibold">{topic.name}</h1>
        </div>

        {/* Question List */}
        {
          topic.questions.length === 0 ? (
            <p className="text-sm text-[#d0d0d0]">No questions yet.</p>
          ) : (
            topic.questions.map((q, index) => (
              <div
                key={q.id}
                className="flex flex-col gap-2 p-4 bg-[#f0f0f0] rounded cursor-pointer"
                onClick={() => router.push(`/app/${idArray.join("/")}/${index}`)}
              >
                <h2 className="text-lg font-semibold">{q.title}</h2>
                <p className="text-sm text-[#333333]">
                  {q.description || "No description"}
                </p>
              </div>
            ))
          )
        }

        <div className="flex flex-col items-center">
          {!addingQ ? (
            <div
              className="w-1/2 max-w-xl p-5 cursor-pointer"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f0f0f0 10px, #f0f0f0 20px)",
              }}
              onClick={() => {
                setAddingQ(!addingQ);
              }}
            >
              + New Question/Source
            </div>
          ) : (
            <div className="flex flex-row gap-2 w-1/2 max-w-xl">
              <div
                className="flex-1 p-5 cursor-pointer"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f0f0f0 10px, #f0f0f0 20px)",
                }}
                onClick={() => addQuestion(true)}
              >
                Question
              </div>
              <div
                className="flex-1 p-5 cursor-pointer"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f0f0f0 10px, #f0f0f0 20px)",
                }}
                onClick={() => addQuestion(false)}
              >
                Source
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (data.type === "question") {
    const question = data as Question;

    return (
      // Question View
      <div className="flex flex-col p-6 gap-4 color-white">
        <div className="flex flex-row justify-between">
          <h1 className="text-2xl font-semibold">{question.title}</h1>
        </div>

        <p className="text-sm text-[#333333]">
          {question.description || "No description"}
        </p>

        {/* Source List */}
        {
          question.sources.length === 0 ? (
            <p className="text-sm text-[#d0d0d0]">No sources yet.</p>
          ) : (
            question.sources.map((s, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 p-4 bg-[#f0f0f0] rounded"
              >
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <a href={s.url} className="text-sm text-blue-500">
                  {s.url}
                </a>
                <p className="text-sm text-[#333333]">
                  {s.summary || "No summary"}
                </p>
              </div>
            ))
          )
        }
      </div>
    );
  } else {
    return <h1>Unknown Type</h1>;
  }
}
