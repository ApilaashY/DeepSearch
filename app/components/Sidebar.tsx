'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import { Topic } from '@/lib/redux/slices/topicSlice';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { IoMdMenu } from 'react-icons/io';

export default function Sidebar() {
  const params = useParams();
  const searchTopics = useAppSelector((state) => state.topics.topics);
  const [topics, setTopics] = useState(searchTopics);
  const [showMobileBar, setMobileBar] = useState(false);

  // fetch all topics from db and add to redux store on initial load
  useEffect(() => {
    fetch('/api/topic/get', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        setMobileBar(false);
      });
  }, [params.id]);

  const backdropRef = useRef<HTMLDivElement>(null);

  // Attach non-passive listeners so we can call preventDefault()
  // and stop the browser from also scrolling the window.
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    const getContent = () => document.querySelector<HTMLElement>('.flex-1.overflow-auto');

    let touchStart = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const content = getContent();
      if (content) content.scrollTop += e.deltaY;
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const content = getContent();
      if (content) {
        const deltaY = touchStart - e.touches[0].clientY;
        content.scrollTop += deltaY;
        touchStart = e.touches[0].clientY;
      }
    };

    backdrop.addEventListener('wheel', onWheel, { passive: false });
    backdrop.addEventListener('touchstart', onTouchStart, { passive: true });
    backdrop.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      backdrop.removeEventListener('wheel', onWheel);
      backdrop.removeEventListener('touchstart', onTouchStart);
      backdrop.removeEventListener('touchmove', onTouchMove);
    };
  }, [showMobileBar]);

  return (
    <>
      <div className="bg-(--primary) h-full p-6 w-75 text-white flex flex-col gap-12 max-md:hidden">
        <InnerSidebar
          topics={topics}
          currentId={params.id ? String(params.id).replace('t_', '') : undefined}
        />
      </div>
      <div
        className="md:hidden w-full bg-(--primary) m-0 p-2"
        onClick={() => setMobileBar((e) => !e)}
      >
        <IoMdMenu
          size={40}
          color="white"
          className={`cursor-pointer transition-transform duration-300 ease-in-out ${
            showMobileBar ? 'rotate-90 translate-x-[70vw]' : ''
          }`}
        />
      </div>
      <div
        className={`absolute md:hidden bg-(--primary) h-full p-6 w-125 max-w-[70vw] text-white flex flex-col gap-12 z-20 ${
          showMobileBar ? '' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <InnerSidebar
          topics={topics}
          currentId={params.id ? String(params.id).replace('t_', '') : undefined}
        />
      </div>
      <div
        ref={backdropRef}
        className={`absolute md:hidden ${showMobileBar ? '' : 'hidden'} z-10 w-screen h-full`}
        onClick={() => setMobileBar(false)}
      ></div>
    </>
  );
}

function InnerSidebar({ topics, currentId }: { topics: Topic[]; currentId?: string }) {
  return (
    <>
      {/* Title */}
      <Link href="/app" className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold">SuDeep</h1>
        <h3 className="text-md font-semibold text-[#d0d0d0]">Research Console</h3>
      </Link>

      {/* Create New Topic */}
      <div className="flex flex-col gap-2">
        <Link href="/app" className="text-lg font-semibold cursor-pointer hover:text-[#d0d0d0]">
          Create New
        </Link>
      </div>

      {/* Topics */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Topics</h3>
        <div className="flex flex-col gap-2 mt-2 pl-3">
          {topics.length === 0 ? (
            <p className="text-md text-[#d0d0d0]">No topics yet.</p>
          ) : (
            topics.map((topic) => (
              <Link
                href={`/app/t_${topic.id}`}
                key={topic.id}
                className={`text-md cursor-pointer p-2 rounded hover:text-[#d0d0d0] truncate ${
                  currentId === topic.id ? 'bg-[rgba(0,0,0,0.35)]' : ''
                }`}
              >
                {topic.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
