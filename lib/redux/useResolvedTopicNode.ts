import { useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  addTopics,
  defaultQuestion,
  defaultSource,
  defaultTopic,
  Topic,
  Question,
  Source,
} from '@/lib/redux/slices/topicSlice';

type TopicNode = Topic | Question | Source;

type FetchTarget = {
  type: 'topic' | 'question' | 'source';
  id: string;
};

function parseRouteToken(routeToken: string): FetchTarget {
  const underscoreIndex = routeToken.indexOf('_');

  if (underscoreIndex === -1) {
    return { type: 'topic', id: routeToken };
  }

  const type = routeToken.slice(0, underscoreIndex);
  const id = routeToken.slice(underscoreIndex + 1);

  if (type === 'topic' || type === 'question' || type === 'source') {
    return { type, id };
  }

  return { type: 'topic', id: routeToken };
}

function createFetchUrl(target: FetchTarget): string {
  switch (target.type) {
    case 'question':
      return `/api/question/get/${target.id}`;
    case 'source':
      return `/api/source/get/${target.id}`;
    case 'topic':
    default:
      return `/api/topic/get/${target.id}`;
  }
}

function createDefaultNode(routeToken: string): TopicNode {
  const fetchTarget = parseRouteToken(routeToken);

  if (fetchTarget.type === 'topic') {
    return { ...defaultTopic, id: fetchTarget.id, pending: true };
  }

  if (fetchTarget.type === 'question') {
    return { ...defaultQuestion, pending: true };
  }

  return { ...defaultSource, pending: true };
}

function findQuestionInTree(topic: Topic, questionId: string): Question | undefined {
  const directQuestion = topic.questions.find((question) => question.id === questionId);

  if (directQuestion !== undefined) {
    return directQuestion;
  }

  for (const question of topic.questions) {
    const nestedQuestion = question.questions?.find(
      (childQuestion) => childQuestion.id === questionId
    );

    if (nestedQuestion !== undefined) {
      return nestedQuestion;
    }
  }

  return undefined;
}

function findSourceInTree(topic: Topic, sourceId: string): Source | undefined {
  for (const question of topic.questions) {
    const directSource = question.sources?.find((source) => source.parentId === sourceId);

    if (directSource !== undefined) {
      return directSource;
    }

    for (const childQuestion of question.questions ?? []) {
      const nestedSource = childQuestion.sources?.find((source) => source.parentId === sourceId);

      if (nestedSource !== undefined) {
        return nestedSource;
      }
    }
  }

  return undefined;
}

function resolveTopicNode(topics: Topic[], routeToken: string): TopicNode | undefined {
  const fetchTarget = parseRouteToken(routeToken);
  const rootTopic =
    fetchTarget.type === 'topic'
      ? topics.find((topic) => topic.id === fetchTarget.id)
      : topics.find((topic) => {
          if (fetchTarget.type === 'question') {
            return findQuestionInTree(topic, fetchTarget.id) !== undefined;
          }

          return findSourceInTree(topic, fetchTarget.id) !== undefined;
        });

  if (fetchTarget.type === 'topic') {
    return rootTopic;
  }

  if (rootTopic === undefined) {
    return undefined;
  }

  if (fetchTarget.type === 'question') {
    return findQuestionInTree(rootTopic, fetchTarget.id);
  }

  return findSourceInTree(rootTopic, fetchTarget.id);
}

export function useResolvedTopicNode(routeToken: string) {
  const topics = useAppSelector((state) => state.topics.topics);
  const dispatch = useAppDispatch();
  const [data, setData] = useState<TopicNode>(() => createDefaultNode(routeToken));
  const attemptedFetchKey = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const requestKey = routeToken;

    if (routeToken.trim() === '') {
      setData({ ...defaultTopic, id: '', pending: false });
      return () => {
        isCancelled = true;
      };
    }

    const cachedNode = resolveTopicNode(topics, routeToken);

    if (cachedNode !== undefined) {
      attemptedFetchKey.current = null;
      setData(cachedNode);
      return () => {
        isCancelled = true;
      };
    }

    if (attemptedFetchKey.current !== requestKey) {
      setData(createDefaultNode(routeToken));
    }

    if (attemptedFetchKey.current === requestKey) {
      setData({ ...createDefaultNode(routeToken), pending: false });
      return () => {
        isCancelled = true;
      };
    }

    attemptedFetchKey.current = requestKey;

    async function fetchFromBackend() {
      try {
        const fetchTarget = parseRouteToken(routeToken);
        const response = await fetch(createFetchUrl(fetchTarget));

        if (!response.ok) {
          if (!isCancelled) {
            setData({ ...createDefaultNode(routeToken), pending: false });
          }
          return;
        }

        const node = await response.json();
        if (fetchTarget.type === 'topic') {
          dispatch(addTopics([node]));
        }

        if (!isCancelled) {
          setData(node);
        }
      } catch (error) {
        console.error('Failed to resolve topic node:', error);

        if (!isCancelled) {
          setData({ ...createDefaultNode(routeToken), pending: false });
        }
      }
    }

    void fetchFromBackend();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, routeToken, topics]);

  return data;
}
