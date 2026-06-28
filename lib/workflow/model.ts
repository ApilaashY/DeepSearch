import { ChatOllama, Ollama } from '@langchain/ollama';

// For chat models
// const chatModel = new ChatOllama({
//   model: "llama3", // Replace with your desired model name
//   baseUrl: "http://localhost:11434", // Default Ollama URL
//   temperature: 0.7,
//   topP: 0.9,
// });

// For regular LLMs

export const lightModel = new ChatOllama({
  model: 'gemma4:e4b',
});

export const strongModel = new Ollama({
  model: 'deepseek-r1:32b',
});

export const textEmbeddingModel = 'nomic-embed-text';
