import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Topic {
  id: string;
  name: string;
  description: string;
  questions: (Question | Source)[];
  summary: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  sources: (Question | Source)[];
  summary: string;
  index: number;
}

export interface Source {
  title: string;
  url: string;
  summary: string;
  question_id: string;
  index: number;
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
    addTopic: (state, action: PayloadAction<Topic>) => {
      const existing = state.topics.findIndex(t => t.id === action.payload.id);

      if (existing !== -1) {
        state.topics[existing] = action.payload;
      } else {
        state.topics.push(action.payload);
      }
    },
  },
});

export const { addTopic } = topicSlice.actions;

export default topicSlice.reducer;
