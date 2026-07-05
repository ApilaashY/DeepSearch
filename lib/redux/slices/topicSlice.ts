import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Topic {
  type: 'topic';
  id: string;
  name: string;
  description: string;
  questions: Question[];
  sources: Source[];
  summary: string;
  ai_pending: boolean;
  source_locked: boolean;
}

export const defaultTopic: Topic = {
  id: '',
  name: '',
  description: '',
  questions: [],
  sources: [],
  summary: '',
  ai_pending: false,
  type: 'topic',
  source_locked: false,
};

export interface Question {
  type: 'question';
  id: string;
  title: string;
  description: string;
  summary: string;
  ai_pending: boolean;
  sources: string[];
  questions: Question[];
  topicId: string;
}

export const defaultQuestion: Question = {
  id: '',
  title: '',
  description: '',
  summary: '',
  ai_pending: false,
  type: 'question',
  sources: [],
  questions: [],
  topicId: '',
};

export interface Source {
  id: string;
  type: 'source';
  title: string;
  url: string;
  summary: string;
  topicId: string;
  ai_pending: boolean;
}

export const defaultSource: Source = {
  id: '',
  title: '',
  url: '',
  summary: '',
  topicId: '',
  ai_pending: false,
  type: 'source',
};

export interface TopicState {
  topics: Topic[];
}

const initialState: TopicState = {
  topics: [],
};

export const topicSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    addTopics: (state, action: PayloadAction<Topic[]>) => {
      action.payload.forEach((topic) => {
        const existing = state.topics.findIndex((t) => t.id === topic.id);

        if (existing !== -1) {
          state.topics[existing] = topic;
        } else {
          state.topics.push(topic);
        }
      });
    },
  },
});

export const { addTopics } = topicSlice.actions;

export default topicSlice.reducer;
