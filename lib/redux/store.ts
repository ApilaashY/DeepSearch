import { configureStore } from '@reduxjs/toolkit';
import topicReducer from './slices/topicSlice';

export const store = configureStore({
  reducer: {
    topics: topicReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
