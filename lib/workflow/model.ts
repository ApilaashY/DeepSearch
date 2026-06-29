import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';

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

export const strongModel = new ChatOllama({
  model: 'qwen3:30b', //'deepseek-r1:32b',
});

export const textEmbeddingModel = new OllamaEmbeddings({ model: 'nomic-embed-text' });
