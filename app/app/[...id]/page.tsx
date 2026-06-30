'use client';

import { useParams } from 'next/navigation';

import TopicPage from '@/app/components/topic/topic';
import QuestionPage from '@/app/components/question/question';
import SourcePage from '@/app/components/sources/sources';

export default function IdPage() {
  const params = useParams();

  const id = params?.id;
  const lastId = id?.[id?.length - 1];

  if (typeof lastId !== 'string') {
    return <h1>Not Found</h1>;
  }

  if (lastId.startsWith('t_')) {
    return <TopicPage id={lastId.slice(2)} />;
  } else if (lastId.startsWith('q_')) {
    return <QuestionPage id={lastId.slice(2)} />;
  } else if (lastId.startsWith('s_')) {
    return <SourcePage id={lastId.slice(2)} />;
  } else {
    return <h1>Invalid ID</h1>;
  }
}
