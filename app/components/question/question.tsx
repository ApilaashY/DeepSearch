import { Logger } from '@/lib/logger';
import { Question } from '@/lib/redux/slices/topicSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const logger = new Logger('Question Page');

export default function QuestionPage({ id }: { id: string }) {
  // Main Data
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // UI Component Data
  const [editingQuestion, setEditingQuestion] = useState<boolean>(false);
  const [addingQ, setAddingQ] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftDescription, setDraftDescription] = useState<string>('');
  const [savingQuestion, setSavingQuestion] = useState<boolean>(false);

  useEffect(() => {
    fetch(`/api/question/get/${id}`)
      .then((res) => res.json())
      .then((data: { question: Question }) => setQuestion(data.question))
      .catch((err) => {
        if (err.status === 404) {
          setError('Question not found');
        } else {
          setError('Failed to get question');
        }

        logger.error(err);
      });
  }, [id]);

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

  const addQuestion = async () => {
    if (question === null) return;

    const questionTitle = prompt(`What is the question you want to add?`);

    if (questionTitle === null || questionTitle.trim() === '') return;

    const result = await fetch(`/api/question/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: questionTitle.trim(),
        parentId: question.id,
        isTopic: false,
      }),
    });

    if (!result.ok) {
      alert('Failed to add question/source.');
      return;
    }

    setAddingQ(false);

    const { id } = await result.json();

    router.push(`/app/q_${id}`);
  };

  // Error Check
  if (error !== null) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <h1>Error: {error}</h1>
      </div>
    );
  }

  const runSummarizeAgent = async () => {
    alert('Question summarize agent will be wired to the backend soon.');
  };

  const runGenerateAgent = async () => {
    alert('Question generate agent will be wired to the backend soon.');
  };

  // Loading state
  if (question === null) {
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              {!editingQuestion ? (
                <>
                  <p className="text-xs tracking-[0.2em] uppercase text-[#6a7c93]">
                    <span className="cursor-pointer" onClick={() => router.back()}>
                      {'<-'}
                    </span>
                    Question
                  </p>
                  <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#102a43]">
                    {question.title}
                  </h1>
                  <p className="mt-4 text-sm md:text-base text-[#4e6277] leading-relaxed">
                    {question.description}
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
              onClick={() => runGenerateAgent()}
            >
              Generate Subquestions Agent
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
                onClick={() => runSummarizeAgent()}
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
                onClick={() => addQuestion()}
              >
                Subquestion
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

        <div className="rounded-2xl border border-[#d8e2ef] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold mb-3 text-[#102a43]">Questions</h3>
          {question.questions.length === 0 ? (
            <p className="text-sm text-[#8293a8]">No questions yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {question.questions.map((q) => (
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
      </div>
    </div>
  );
}
