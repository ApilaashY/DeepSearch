"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { addTopic } from "@/lib/redux/slices/topicSlice";
import { useRouter } from "next/navigation";

export default function Page() {
  const topics = useAppSelector((state) => state.topics.topics);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const createNewTopic = async () => {
    console.log("Creating new topic...");

    let name: string | null = prompt("Enter topic name:");

    while (name !== null && name.trim() === "") {
      // Keep asking while the input is empty but stop if asked to cancel
      name = prompt("Enter topic name:");
    }

    // If user cancelled the prompt, stop
    if (name === null || name.trim() === "") return;

    // Create the topic using the API call

    try {
      const result = await fetch("/api/topic/create", {
        method: "POST",
        body: JSON.stringify({ name, description: "" }),
      });

      const data = await result.json();

      // Add the topic to the Redux store
      dispatch(addTopic(data));

      // Navigate away using the ID from the database
      router.push(`/app/${data.id}`);
    } catch (error) {
      console.error("Failed to create topic via thunk:", error);
      alert("Failed to create topic. Please try again.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1>Add a new Topic</h1>

      <button
        onClick={createNewTopic}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
      >
        Add Topic
      </button>
    </div>
  );
}
