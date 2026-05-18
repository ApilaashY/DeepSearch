import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
// import { z } from "zod";
import { generalSearch, getLinkContent } from "./search";
import { mdToPdf } from "md-to-pdf";
import fs from "fs";

// --- Model ---
const model = new ChatOllama({
  // model: "qwen3.5:9b",
  model: "gemma4:e2b"
});
const strongModel = new ChatOllama({
  model: "gemma4:e4b"
  // model: "qwen3.5:27b"
})
const textEmbeddingModel = "nomic-embed-text";


const lightModel = model;


interface Data {
  information: string,
  references: string[]
}

interface Question {
  question: string,
  data: Data
}

// --- State Definition ---
const GraphState = Annotation.Root({
  problem: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),
  questions: Annotation<Question[]>({
    reducer: (x, y) => {
      // Adds all of the elements of y to x, except if y.question is already in x.
      for (const question of y) {
        const existing = x.find((q) => q.question === question.question);
        if (!existing) {
          x.push(question);
        } else {
          existing.data.information = question.data.information
          existing.data.references = question.data.references
        }
      }
      return x;
    },
    default: () => [],
  }),
  aiCalls: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
  collectedData: Annotation<Data[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  finalReport: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),
});

const questionRefine = async (state: typeof GraphState.State) => {
  console.log("Refining Question...")
  const response = await strongModel.invoke([
    {
      role: "system",
      content: `You are a Research Strategist. 
Your job is to look at the user's initial question and turn it into a clear, detailed research plan.

Instead of just rewriting it to sound professional, try to "read between the lines":
1. If the question is about a trip, think about itineraries, budget levels, local culture, and food.
2. If the question is about a product/investment, think about risks, competitors, and future outlook.
3. If the question is about a hobby/topic, think about psychology, history, and current trends.

Your goal is to output a 2-3 sentence "Expanded Research Scope" that covers what the user is REALLY looking for, even if they didn't say it explicitly.`
    },
    {
      role: "user",
      content: `User's Question: "${state.problem}"`
    }
  ])

  const refined = response.content.toString().trim();
  console.log("Refined Question: ", refined)

  return {
    problem: refined,
    aiCalls: 1
  }
}

const makeQuestions = async (state: typeof GraphState.State) => {
  console.log("Generating Atomic Search Questions...")
  const response = await model.invoke([
    { 
      role: "system", 
      content: `You are a Senior Research Analyst. 
Your task is to break down a complex research objective into exactly 3-5 atomic, searchable sub-questions.

Guidelines:
1. Each question must be answerable using a single Google search.
2. The questions should cover different facets of the main objective (e.g., technical details, current state, historical context, key players).
3. Output ONLY the questions, one per line.
4. Do not use numbers or bullet points like '1.' or '-'. 
5. Do not include any introductory or concluding text.`
    },
    { role: "user", content: state.problem}
  ])

  // Robust parsing: filter out empty lines and trim whitespace
  const rawContent = response.content.toString();
  const questions = rawContent
    .split("\n")
    .map(q => q.replace(/^[\d\s\-\.\*]+/, "").trim()) // Remove leading numbers, dots, dashes, stars
    .filter(q => q.length > 10); // Look for reasonable length sentences

  if (questions.length === 0) {
    console.warn("Warning: No questions extracted from raw output:", rawContent);
  }

  console.log("Generated Questions")

  return {
    questions: questions.map(question => {
      return {
        question: question,
        data: {
          information: "",
          references: []
        }
      }
    }),
    aiCalls: 1
  }
}

/*
This node will turn each question into a search query, and then from the sources of the results choose what articles are useful and extract the information
*/
const researcher = async (state: typeof GraphState.State) => {
  console.log("Researching...")
  const questions = state.questions
  let callCount = 0;

  console.log("Researching Internet...")

  const collectedData: Data[][] = await Promise.all(
    questions.map(async (question, i) => {
      console.log(`Researching ${i+1} of ${questions.length} questions...`)

      // Skip questions that already have data
      if (question.data.information) return [];

      const properQuestion = await lightModel.invoke([{
        role: "system",
        content: "You are a Senior Research Analyst. Turn the given question into a single, highly effective Google search query. Output ONLY the query string."
      }, { role: "user", content: question.question }])
      callCount++;

      const properQuestionContent = properQuestion.content.toString().trim().replace(/^["']|["']$/g, "");
      console.log(`Query for "${question.question.slice(0, 30)}...": ${properQuestionContent}`)

      const results = await generalSearch(properQuestionContent);
      if (results.length === 0) return [];

      // 2. Identify useful sources
      const usefulSources = await model.invoke([{
        role: "system",
        content: `Analyze these search results for the question: "${question.question}". 
  Return a JSON array of indices (e.g., [0, 2]) for the most relevant sources. 
  Output ONLY the array.`
      },
      { role: "user", content: JSON.stringify(results.map((result, i) => `[${i}] ${result.title}: ${result.content}`)) }])
      callCount++;

      // Robust JSON parsing for indices
      let usefulSourcesContent: number[] = [];
      try {
        const match = usefulSources.content.toString().match(/\[[\d,\s]+\]/);
        usefulSourcesContent = match ? JSON.parse(match[0]) : [];
      } catch (e) {
        console.warn("Could not parse source indices, defaulting to first 2.");
        usefulSourcesContent = [0, 1].filter(i => i < results.length);
      }

      console.log("Useful Source Indices:", usefulSourcesContent)

      // 3. Extract content from selected sources
      const data = await Promise.all(usefulSourcesContent.map(async (index) => {
        if (!results[index]) return null;
        const content = await getLinkContent(results[index].url);
        if (content) {
          return ({
              information: content,
              references: [results[index].url]
            })
        }
        return null;
      }));

      return data.filter((d) => d !== null);
    })
  );

  console.log("Finished Researching Internet... Collecting")

  return {
    collectedData: collectedData.flat(),
    aiCalls: callCount
  }
}

/*
This conditional edge will access the information and figure out if the data we have is enough to answer the question, if yes it will move to the synthesiser node, otherwise it will go back to the question generator to generate more questions.
*/
const checkSufficiency = async (state: typeof GraphState.State) => {
  console.log("Checking Sufficiency...")

  // If we already have 5 sets of collected data, we have enough
  if (state.collectedData.length >= 5) {
    return "synthesiser";
  }

  const response = await strongModel.invoke([{
    role: "system",
    content: `You are a Senior Research Analyst.
Your task is to determine if the following data is sufficient to answer the question: "${state.problem}".
Output only "Yes" if it is sufficient, and "No" if it is not.`
  }, {
    role: "user",
    content: JSON.stringify(state.collectedData.map((data) => data.information))
  }])

  const responseContent = response.content.toString().trim();
  console.log("Response Content:", responseContent)

  // Logic to determine if we have enough data to answer the problem
  if (responseContent.toLowerCase().includes("yes")) {
    return "synthesiser";
  }
  
  // If not enough, go back to makeQuestions
  console.log("Not enough info... generating more questions")
  return "makeQuestions";
}

/*
This node will take the collected information and synthesize it into a coherent answer to the original question.
It uses RAG (Retrieval-Augmented Generation) to handle large amounts of data.
*/
const synthesiser = async (state: typeof GraphState.State) => {
  console.log("Synthesizing final report with RAG...")

  const embeddings = new OllamaEmbeddings({ model: textEmbeddingModel });

  // 1. Chunk the collected data
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });

  const docsToIndex: Document[] = [];
  for (const [index, data] of state.collectedData.entries()) {
    const chunks = await textSplitter.splitText(data.information);
    for (const chunk of chunks) {
      docsToIndex.push(new Document({
        pageContent: chunk,
        metadata: { sourceIndex: index, url: data.references[0] }
      }));
    }
  }

  console.log(`Indexing ${docsToIndex.length} chunks from ${state.collectedData.length} sources...`);
  const vectorStore = await MemoryVectorStore.fromDocuments(docsToIndex, embeddings);

  // 2. Retrieve the most relevant chunks for the original problem
  console.log("Retrieving relevant snippets...");
  const relevantDocs = await vectorStore.similaritySearch(state.problem, 10);
  
  const context = relevantDocs.map((doc) => {
    return `Source [${doc.metadata.sourceIndex}] (${doc.metadata.url}):\n${doc.pageContent}`
  }).join("\n\n---\n\n");

  // 3. Generate the final report
  const response = await strongModel.invoke([
    {
      role: "system",
      content: `You are a World-Class Technical Writer. 
Your task is to take the provided research snippets and synthesize them into a STUNNING, user-friendly research report in MARKDOWN.

Design Guidelines:
1. Use a clean, modern hierarchy (H1 for Title, H2 for Sections, H3 for sub-points).
2. Start with an "Executive Summary" that is approachable and highlights the "Final Verdict" in a blockquote.
3. Use Horizontal Rules (---) to separate major sections for visual clarity.
4. Use Bullet Points and Bold text liberally to make the report "scannable."
5. If there are pros/cons or comparisons, use Markdown Tables.
6. Use Citations like [0], [1] and list the URLs at the bottom as a "Bibliography."

Tone: Professional but engaging. Avoid being overly dry or academic. Focus on providing real value and answering the user's core intent.`
    },
    {
      role: "user",
      content: `Original Intent: "${state.problem}"\n\nRelevant Research Snippets:\n\n${context}`
    }
  ])

  const reportMarkdown = response.content.toString();

  // 4. Convert Markdown to PDF
  try {
    console.log("Generating PDF (research.pdf)...");
    const pdf = await mdToPdf({ content: reportMarkdown });
    fs.writeFileSync("research.pdf", pdf.content);
    console.log("PDF successfully saved as research.pdf");
  } catch (pdfError) {
    console.error("Failed to generate PDF:", pdfError);
  }

  console.log("\n--- FINAL REPORT ---\n")
  console.log(reportMarkdown)

  return {
    finalReport: reportMarkdown,
    aiCalls: 1
  }
}

// --- Build the Graph ---
const agent2 = new StateGraph(GraphState)
  .addNode("questionRefine", questionRefine)
  .addNode("makeQuestions", makeQuestions)
  .addNode("researcher", researcher)
  .addNode("synthesiser", synthesiser)
  .addEdge(START, "questionRefine")
  .addEdge("questionRefine", "makeQuestions")
  .addEdge("makeQuestions", "researcher")
  .addConditionalEdges("researcher", checkSufficiency, ["synthesiser", "makeQuestions"])
  .addEdge("synthesiser", END)
  .compile()

// --- Run ---
const main = async () => {
  console.log("--- Running Agent ---\n");

  const result = await agent2.invoke({
    problem: "How do stuffed toys affect teenagers' development and mental health between the ages of 13 and 18?",
  });

  console.log("\n==================================================");
  console.log("AGENT COMPLETE");
  console.log("Total AI Calls:", result.aiCalls);
  console.log("==================================================\n");
};

main();
