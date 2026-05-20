"use client";

import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { useEffect, useState } from "react";
import { Topic } from "@/lib/redux/slices/topicSlice";

export default function IdPage() {
  const params = useParams();
  const topics = useAppSelector((state) => state.topics.topics);
  const [topic, setTopic] = useState<Topic | undefined>();
  const [addingQ, setAddingQ] = useState<boolean>(false);

  useEffect(() => {
    setTopic(topics.find((topic) => topic.id === params.id));
  }, [topics]);

  const addQuestion = (isQuestion: boolean) => {};

  return (
    <div className="flex flex-col p-6 gap-4 color-white">
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-semibold">{topic?.name}</h1>
      </div>

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
          <div
            className="flex flex-row gap-2 w-1/2 max-w-xl cursor-pointer"
            onClick={() => {
              setAddingQ(!addingQ);
            }}
          >
            <div
              className="flex-1 p-5"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f0f0f0 10px, #f0f0f0 20px)",
              }}
              onClick={() => addQuestion(true)}
            >
              Question
            </div>
            <div
              className="flex-1 p-5"
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
}
