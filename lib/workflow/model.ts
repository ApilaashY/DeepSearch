import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// For chat models
// const chatModel = new ChatOllama({
//   model: "llama3", // Replace with your desired model name
//   baseUrl: "http://localhost:11434", // Default Ollama URL
//   temperature: 0.7,
//   topP: 0.9,
// });

// For regular LLMs

export const lightModel =
  process.env.AI_MODEL === 'ollama'
    ? new ChatOllama({
        model: 'gemma4:e4b',
      })
    : new ChatGoogleGenerativeAI({ model: 'gemini-3.5-flash' });

export const strongModel =
  process.env.AI_MODEL === 'ollama'
    ? new ChatOllama({
        model: 'qwen3:30b', //'deepseek-r1:32b',
      })
    : new ChatGoogleGenerativeAI({ model: 'gemini-3.1-flash-lite' });

export const textEmbeddingModel = new OllamaEmbeddings({ model: 'nomic-embed-text' });
