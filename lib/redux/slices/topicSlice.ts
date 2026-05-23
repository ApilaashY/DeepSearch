import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Topic {
  type: 'topic';
  id: string;
  name: string;
  description: string;
  questions: Question[];
  summary: string;
  pending: boolean;
}

const defaultTopic: Topic = {
  id: "",
  name: "",
  description: "",
  questions: [],
  summary: "",
  pending: false,
  type: "topic",
}

export interface Question {
  type: 'question';
  id: string;
  title: string;
  description: string;
  questions: Question[];
  sources: Source[];
  summary: string;
  pending: boolean;
}

const defaultQuestion: Question = {
  id: "",
  title: "",
  description: "",
  questions: [],
  sources: [],
  summary: "",
  pending: false,
  type: "question",
}

export interface Source {
  type: 'source';
  title: string;
  url: string;
  summary: string;
  questionId: string;
  pending: boolean;
}

const defaultSource: Source = {
  title: "",
  url: "",
  summary: "",
  questionId: "",
  pending: false,
  type: "source",
}

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
        const existing = state.topics.findIndex(t => t.id === topic.id);

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
