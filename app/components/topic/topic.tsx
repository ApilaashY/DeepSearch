import { useEffect, useState } from 'react';
import { type Topic } from '@/lib/redux/slices/topicSlice';
import { useRouter } from 'next/navigation';
import { Logger } from '@/lib/logger';

const logger = new Logger('Topic Page');

export default function TopicPage({ id }: { id: string }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingQ, setAddingQ] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTopic = () => {
      fetch(`/api/topic/get/${id}`)
        .then((res) => res.json())
        .then((data: { topic: Topic }) => setTopic(data.topic))
        .catch((err) => {
          if (err.status === 404) {
            setError('Topic not found');
          } else {
            setError('Failed to get topic');
          }

          logger.error(err);
        });
    };

    fetchTopic();
    const interval = setInterval(fetchTopic, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const addQuestion = async () => {
    if (topic === null) return;

    const question = prompt(`What is the question you want to add?`);

    if (question === null || question.trim() === '') return;

    const result = await fetch(`/api/question/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: question.trim(),
        parentId: topic.id,
        isTopicParent: true,
      }),
    });

    if (!result.ok) {
      alert('Failed to add question/source.');
      return;
    }

    setAddingQ(false);

    const { id, type } = await result.json();

    router.push(`/app/${type}_${id}`);
  };

  const addSource = async () => {
    if (topic === null) return;

    const question = prompt(`What is the source you want to add?`);

    if (question === null || question.trim() === '') return;

    const result = await fetch(`/api/question/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: question.trim(),
        parentId: topic.id,
      }),
    });

    if (!result.ok) {
      alert('Failed to add source.');
      return;
    }

    setAddingQ(false);

    const { id, type } = await result.json();

    router.push(`/app/${type}_${id}`);
  };

  const runGenerateAgent = async () => {
    if (topic === null) return;

    try {
      const response = await fetch('/api/graphile/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: topic.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const resData = await response.json();
      if (resData.success) {
        alert('Research job successfully offloaded to Graphile Worker!');
      } else {
        alert('Failed to trigger research job: ' + (resData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error triggering research:', error);
      alert('Failed to trigger research job.');
    }
  };

  // Page rendering

  // Error check
  if (error !== null) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <h1>Error: {error}</h1>
      </div>
    );
  }

  // Loading state
  if (topic === null || topic === undefined) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <h1>Loading...</h1>
      </div>
    );
  }

  // Final result
  return (
    <div
      className="min-h-full p-6 md:p-8"
      style={{ background: 'linear-gradient(180deg, #fbfcff 0%, #f2f6fb 100%)' }}
    >
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <div className="rounded-2xl border border-[#d8e2ef] bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs tracking-[0.2em] uppercase text-[#6a7c93]">Topic</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#102a43]">{topic.name}</h1>
              <p className="mt-3 text-sm md:text-base text-[#4e6277] leading-relaxed">
                {topic.description || 'This topic collects questions and direct sources.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-[#80bfff] bg-[#e8f3ff] px-4 py-2 text-sm font-medium text-[#0b4ea2] hover:bg-[#dcedff] cursor-pointer"
                onClick={() => runGenerateAgent()}
              >
                Perform Research Analysis
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#dbe6f2] bg-[#f9fcff] p-4">
            <p className="text-xs tracking-[0.16em] uppercase text-[#6a7c93]">Summary</p>
            <p className="mt-2 text-sm text-[#5c7189] leading-relaxed">
              {topic.summary || 'No AI summary yet. Click summarize to generate one later.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          {!addingQ ? (
            <button
              className="px-4 py-2 rounded-lg cursor-pointer text-sm font-medium text-[#102a43] border border-[#d8e2ef] bg-white hover:bg-[#f8fbff]"
              onClick={() => setAddingQ(true)}
            >
              + New Item
            </button>
          ) : (
            <div className="flex flex-row gap-2">
              <button
                className="px-4 py-2 rounded-lg cursor-pointer text-sm font-medium text-white bg-[#1f6feb] hover:bg-[#1b62d3]"
                onClick={addQuestion}
              >
                Question
              </button>
              <button
                className="px-4 py-2 rounded-lg cursor-pointer text-sm font-medium text-white bg-[#0f8b63] hover:bg-[#0d7a57]"
                onClick={addSource}
              >
                Source
              </button>
              <button
                className="px-3 py-2 rounded-lg cursor-pointer text-sm text-[#9f1239] bg-[#ffe4e6] hover:bg-[#fecdd3]"
                onClick={() => setAddingQ(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#d8e2ef] bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-[#102a43]">Questions</h3>
            {topic.questions.length === 0 ? (
              <p className="text-sm text-[#8293a8]">No questions yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topic.questions.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-[#dbe6f2] bg-[#f9fcff] cursor-pointer hover:bg-white hover:shadow-sm transition"
                    onClick={() => router.push(`/app/q_${q.id}`)}
                  >
                    <h4 className="font-semibold text-lg text-[#12314f]">{q.title}</h4>
                    <p className="text-sm text-[#5c7189] mt-1 line-clamp-2">
                      {q.description || 'No description yet'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#d8e2ef] bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-[#102a43]">Sources</h3>
            {topic.sources.length === 0 ? (
              <p className="text-sm text-[#8293a8]">No sources yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topic.sources.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-[#dbe6f2] bg-[#f9fcff] hover:bg-white hover:shadow-sm transition"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-semibold text-lg text-[#12314f]">
                          {s.title || 'Untitled source'}
                        </h4>
                        {s.url ? (
                          <a
                            href={s.url}
                            className="text-sm text-[#1f6feb] break-all hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {s.url}
                          </a>
                        ) : (
                          <p className="text-xs text-[#7f91a6] mt-1">No URL yet</p>
                        )}
                      </div>
                      <span className="rounded-full bg-[#e7f0fb] px-2 py-1 text-xs text-[#335f89]">
                        Source
                      </span>
                    </div>
                    <p className="text-sm text-[#5c7189] mt-2 line-clamp-3">
                      {s.summary || 'No summary yet'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
