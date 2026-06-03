'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useResolvedTopicNode } from '@/lib/redux/useResolvedTopicNode';
import { Topic, Question, Source } from '@/lib/redux/slices/topicSlice';

export default function IdPage() {
  const params = useParams();
  const router = useRouter();

  const routeToken = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';

  const data = useResolvedTopicNode(routeToken);
  const [addingQ, setAddingQ] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftDescription, setDraftDescription] = useState<string>('');
  const [savingQuestion, setSavingQuestion] = useState<boolean>(false);

  const quickDescription = useMemo(() => {
    if (data.type !== 'question') return '';
    return data.description || 'Describe what this question is trying to answer.';
  }, [data]);

  if (data.pending) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <h1>Loading topic...</h1>
      </div>
    );
  }

  // Check if topic exists or not
  if (
    !data.pending &&
    ((data.type === 'topic' && data.name === '') ||
      (data.type === 'question' && data.title === '') ||
      (data.type === 'source' && data.title === ''))
  ) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <h1>Topic not found</h1>
      </div>
    );
  }

  const addQuestion = async (isQuestion: boolean) => {
    if (data.type === 'source') return;

    const question = prompt(`What is the ${isQuestion ? 'Question' : 'Source'} you want to add?`);

    if (question === null || question.trim() === '') return;

    const result = await fetch(`/api/${isQuestion ? 'question' : 'source'}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: question.trim(),
        parentId: data.id,
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

  const saveQuestionDetails = async (questionId: string) => {
    if (draftTitle.trim() === '') {
      alert('Question title cannot be empty.');
      return;
    }

    setSavingQuestion(true);

    try {
      const result = await fetch('/api/question/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: questionId,
          title: draftTitle.trim(),
          description: draftDescription.trim(),
        }),
      });

      if (!result.ok) {
        alert('Failed to update question details.');
        return;
      }

      setEditingQuestion(false);
      router.refresh();
    } finally {
      setSavingQuestion(false);
    }
  };

  const runGenerateAgent = async (mode: 'questions' | 'sources') => {
    alert(
      mode === 'questions'
        ? 'Generate Subquestions agent will be wired to the backend soon.'
        : 'Generate Sources agent will be wired to the backend soon.'
    );
  };

  const runSummarizeAgent = async (mode: 'question' | 'source') => {
    alert(
      mode === 'question'
        ? 'Question summarize agent will be wired to the backend soon.'
        : 'Source summarize agent will be wired to the backend soon.'
    );
  };

  if (data.type === 'topic') {
    const topic = data as Topic;
    return (
      // Topic View
      <div className="flex flex-col p-6 gap-4 color-white">
        <div className="flex flex-row justify-between">
          <h1 className="text-2xl font-semibold">{topic.name}</h1>
        </div>

        {/* Question List */}
        {topic.questions.length === 0 ? (
          <p className="text-sm text-[#d0d0d0]">No questions yet.</p>
        ) : (
          topic.questions.map((q) => (
            <div
              key={q.id}
              className="flex flex-col gap-2 p-4 bg-[#f0f0f0] rounded cursor-pointer"
              onClick={() => router.push(`/app/question_${q.id}`)}
            >
              <h2 className="text-lg font-semibold">{q.title}</h2>
              <p className="text-sm text-[#333333]">{q.description || 'No description'}</p>
            </div>
          ))
        )}

        {/* Add Question/Source Button */}
        <div className="flex flex-col items-center">
          {!addingQ ? (
            <div
              className="w-1/2 max-w-xl p-5 cursor-pointer"
              style={{
                background:
                  'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f0f0f0 10px, #f0f0f0 20px)',
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
                    'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f0f0f0 10px, #f0f0f0 20px)',
                }}
                onClick={() => addQuestion(true)}
              >
                Question
              </div>
              <div
                className="flex-1 p-5 cursor-pointer"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f0f0f0 10px, #f0f0f0 20px)',
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
  } else if (data.type === 'question') {
    const question = data as Question;

    return (
      <div
        className="min-h-full p-6 md:p-8"
        style={{ background: 'linear-gradient(180deg, #fbfcff 0%, #f2f6fb 100%)' }}
      >
        <div className="mx-auto max-w-6xl flex flex-col gap-6">
          <div className="rounded-2xl border border-[#d8e2ef] bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                {!editingQuestion ? (
                  <>
                    <p className="text-xs tracking-[0.2em] uppercase text-[#6a7c93]">Question</p>
                    <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#102a43]">
                      {question.title}
                    </h1>
                    <p className="mt-4 text-sm md:text-base text-[#4e6277] leading-relaxed">
                      {quickDescription}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input
                      className="w-full rounded-lg border border-[#c9d7e8] px-3 py-2 text-[#102a43]"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Question title"
                    />
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border border-[#c9d7e8] px-3 py-2 text-[#102a43]"
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      placeholder="Question description"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {!editingQuestion ? (
                  <button
                    className="rounded-lg px-3 py-2 text-sm font-medium text-white bg-[#1f6feb] hover:bg-[#1b62d3]"
                    onClick={() => {
                      setDraftTitle(question.title || '');
                      setDraftDescription(question.description || '');
                      setEditingQuestion(true);
                    }}
                  >
                    Edit Details
                  </button>
                ) : (
                  <>
                    <button
                      className="rounded-lg px-3 py-2 text-sm font-medium text-white bg-[#1f6feb] disabled:opacity-60"
                      disabled={savingQuestion}
                      onClick={() => saveQuestionDetails(question.id)}
                    >
                      {savingQuestion ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="rounded-lg px-3 py-2 text-sm font-medium text-[#334e68] bg-[#eaf0f6] hover:bg-[#dbe5ef]"
                      onClick={() => {
                        setEditingQuestion(false);
                        setDraftTitle(question.title || '');
                        setDraftDescription(question.description || '');
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className="rounded-full border border-[#80bfff] bg-[#e8f3ff] px-4 py-2 text-sm font-medium text-[#0b4ea2] hover:bg-[#dcedff]"
                onClick={() => runGenerateAgent('questions')}
              >
                Generate Subquestions Agent
              </button>
              <button
                className="rounded-full border border-[#8adfb2] bg-[#e8fff1] px-4 py-2 text-sm font-medium text-[#13693a] hover:bg-[#ddf8ea]"
                onClick={() => runGenerateAgent('sources')}
              >
                Generate Sources Agent
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-[#dbe6f2] bg-[#f9fcff] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.16em] uppercase text-[#6a7c93]">Summary</p>
                  <p className="mt-2 text-sm text-[#5c7189] leading-relaxed">
                    {question.summary || 'No AI summary yet. Click summarize to generate one.'}
                  </p>
                </div>
                <button
                  className="rounded-lg border border-[#b8cdf1] bg-white px-3 py-2 text-sm font-medium text-[#24508f] hover:bg-[#f2f7ff]"
                  onClick={() => runSummarizeAgent('question')}
                >
                  Summarize Agent
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            {!addingQ ? (
              <button
                className="px-4 py-2 rounded-lg cursor-pointer text-sm font-medium text-[#102a43] border border-[#d8e2ef] bg-white hover:bg-[#f8fbff]"
                onClick={() => setAddingQ(true)}
              >
                + New Subitem
              </button>
            ) : (
              <div className="flex flex-row gap-2">
                <button
                  className="px-4 py-2 rounded-lg cursor-pointer text-sm font-medium text-white bg-[#1f6feb] hover:bg-[#1b62d3]"
                  onClick={() => addQuestion(true)}
                >
                  Subquestion
                </button>
                <button
                  className="px-4 py-2 rounded-lg cursor-pointer text-sm font-medium text-white bg-[#0f8b63] hover:bg-[#0d7a57]"
                  onClick={() => addQuestion(false)}
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
            {/* Subquestions Column */}
            <div className="rounded-2xl border border-[#d8e2ef] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-[#102a43]">Subquestions</h3>

              {!question.questions || question.questions.length === 0 ? (
                <p className="text-sm text-[#8293a8]">No subquestions yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {question.questions.map((sq) => (
                    <div
                      key={sq.id}
                      className="p-4 rounded-xl border border-[#dbe6f2] bg-[#f9fcff] cursor-pointer hover:bg-white hover:shadow-sm transition"
                      onClick={() => router.push(`/app/question_${sq.id}`)}
                    >
                      <h4 className="font-semibold text-lg text-[#12314f]">{sq.title}</h4>
                      <p className="text-sm text-[#5c7189] mt-1 line-clamp-2">
                        {sq.description || 'No description yet'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sources Column */}
            <div className="rounded-2xl border border-[#d8e2ef] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-[#102a43]">Sources</h3>

              {!question.sources || question.sources.length === 0 ? (
                <p className="text-sm text-[#8293a8]">No sources yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {question.sources.map((s) => (
                    <div
                      key={s.parentId}
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
  } else if (data.type === 'source') {
    const source = data as Source;

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
                  <p className="text-xs tracking-[0.16em] uppercase text-[#6a7c93]">
                    Reference URL
                  </p>
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

              <div className="flex gap-2">
                <button
                  className="rounded-full border border-[#8adfb2] bg-[#e8fff1] px-4 py-2 text-sm font-medium text-[#13693a] hover:bg-[#ddf8ea]"
                  onClick={() => runGenerateAgent('sources')}
                >
                  Generate Sources Agent
                </button>
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
                  onClick={() => runSummarizeAgent('source')}
                >
                  Summarize Agent
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8e2ef] bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold mb-2 text-[#102a43]">How This Helps</h3>
            <p className="text-sm text-[#5c7189] leading-relaxed">
              Keep this page as the evidence card for the question. Add generated or manual
              summaries, validate the source URL, and use this record to support downstream agent
              reasoning.
            </p>
          </div>
        </div>
      </div>
    );
  } else {
    return <h1>Unknown Type</h1>;
  }
}
