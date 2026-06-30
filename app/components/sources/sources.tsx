import { Logger } from '@/lib/logger';
import { Source } from '@/lib/redux/slices/topicSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const logger = new Logger('Sources Page');

export default function SourcePage({ id }: { id: string }) {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSource = () => {
      fetch(`/api/source/get/${id}`)
        .then((res) => res.json())
        .then((data: { source: Source }) => setSource(data.source))
        .catch((err) => {
          if (err.status === 404) {
            setError('Source not found');
          } else {
            setError('Failed to get source');
          }

          logger.error(err);
        });
    };

    fetchSource();
    const interval = setInterval(fetchSource, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // Error Check
  if (error !== null) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <h1>{error}</h1>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={() => router.push('/app/dashboard')}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Loading Check
  if (source === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1>Loading...</h1>
      </div>
    );
  }

  // Actions
  const runSummarizeAgent = async () => {
    alert('Summarize agent will be wired to the backend soon.');
  };

  // Final result
  return (
    <div
      className="min-h-full p-6 md:p-8"
      style={{ background: 'linear-gradient(180deg, #fbfcff 0%, #f2f6fb 100%)' }}
    >
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        <div className="rounded-2xl border border-[#d8e2ef] bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs tracking-[0.2em] uppercase text-[#6a7c93]">Source</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#102a43]">
                {source.title || 'Untitled source'}
              </h1>

              <div className="mt-4 rounded-xl border border-[#dbe6f2] bg-[#f9fcff] p-4">
                <p className="text-xs tracking-[0.16em] uppercase text-[#6a7c93]">Reference URL</p>
                {source.url ? (
                  <a
                    href={source.url}
                    className="mt-2 inline-block text-sm text-[#1f6feb] break-all hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.url}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-[#8293a8]">No URL has been provided yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#dbe6f2] bg-[#f9fcff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.16em] uppercase text-[#6a7c93]">Summary</p>
                <p className="mt-2 text-sm text-[#5c7189] leading-relaxed">
                  {source.summary || 'No AI summary yet. Click summarize to generate one.'}
                </p>
              </div>
              <button
                className="rounded-lg border border-[#b8cdf1] bg-white px-3 py-2 text-sm font-medium text-[#24508f] hover:bg-[#f2f7ff]"
                onClick={() => runSummarizeAgent()}
              >
                Summarize Agent
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#d8e2ef] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold mb-2 text-[#102a43]">How This Helps</h3>
          <p className="text-sm text-[#5c7189] leading-relaxed">
            Keep this page as the evidence card for the question. Add generated or manual summaries,
            validate the source URL, and use this record to support downstream agent reasoning.
          </p>
        </div>
      </div>
    </div>
  );
}
