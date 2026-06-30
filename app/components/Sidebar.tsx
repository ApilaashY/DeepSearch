'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const params = useParams();
  const searchTopics = useAppSelector((state) => state.topics.topics);
  const [topics, setTopics] = useState(searchTopics);

  // fetch all topics from db and add to redux store on initial load
  useEffect(() => {
    fetch('/api/topic/get', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
      });
  }, [params.id]);

  return (
    <div className="bg-[#012542] h-full p-6 w-[250px] text-white flex flex-col gap-12">
      {/* Title */}
      <Link href="/app" className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">SuDeep</h1>
        <h3 className="text-sm font-semibold text-[#d0d0d0]">Research Console</h3>
      </Link>

      {/* Create New Topic */}
      <div className="flex flex-col gap-2">
        <Link href="/app" className="text-md font-semibold cursor-pointer hover:text-[#d0d0d0]">
          Create New
        </Link>
      </div>

      {/* Topics */}
      <div className="flex flex-col gap-2">
        <h3 className="text-md font-semibold">Topics</h3>
        <div className="flex flex-col gap-2 mt-2 pl-3">
          {topics.length === 0 ? (
            <p className="text-sm text-[#d0d0d0]">No topics yet.</p>
          ) : (
            topics.map((topic) => (
              <Link
                href={`/app/t_${topic.id}`}
                key={topic.id}
                className="text-sm cursor-pointer hover:text-[#d0d0d0] truncate"
              >
                {topic.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
