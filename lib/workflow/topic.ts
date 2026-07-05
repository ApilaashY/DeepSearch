import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from '@langchain/classic/text_splitter';
import { Document } from '@langchain/core/documents';
import { lightModel, strongModel, textEmbeddingModel } from './model';
import { Logger } from '../logger';
import { generalSearch, getLinkContent } from './search';
import { addQuestion } from '../operations/question/addQuestion';
import { updateTopic } from '../operations/topic/updateTopic';
import { addSource } from '../operations/source/addSource';

const logger = new Logger('Topic Workflow');

interface Data {
  information: string;
  references: string[];
}

interface QueryQuestion {
  question: string;
  data: Data;
}

// --- State Definition ---
const GraphState = Annotation.Root({
  topicId: Annotation<string>({
    reducer: (x) => x,
  }),
  problem: Annotation<string>({
    reducer: (_, y) => y,
  }),
  questions: Annotation<QueryQuestion[]>({
    reducer: (x, y) => {
      // Adds all of the elements of y to x, except if y.question is already in x.
      for (const question of y) {
        const existing = x.find((q) => q.question === question.question);
        if (!existing) {
          x.push(question);
        } else {
          existing.data.information = question.data.information;
          existing.data.references = question.data.references;
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
    default: () => '',
  }),
});

const questionRefine = async (state: typeof GraphState.State) => {
  logger.log('Refining Question...');

  const existingQuestions = state.questions.map((q) => q.question);
  const existingQuestionsBlock =
    existingQuestions.length > 0
      ? `\n\nThe user has already identified these specific areas of interest:\n${existingQuestions
          .map((q) => `- ${q}`)
          .join(
            '\n'
          )}\nIncorporate these into your analysis — they reveal what the user cares about. Do not simply repeat them; use them as signals to go deeper.`
      : '';

  const response = await strongModel.invoke([
    {
      role: 'system',
      content: `You are a Research Strategist whose job is to transform a raw user query into a deep, multi-dimensional research objective. You do NOT answer the query and you do NOT generate a list of sub-questions — a downstream agent handles question decomposition. Your sole job is to produce the richest possible understanding of what needs to be researched and why.

PROCESS:

1. DECODE THE REAL INTENT
   Go beyond the literal words. Ask yourself: what decision, action, or outcome is the user working toward? A question about "best programming language for AI" likely means "I'm choosing a language for an AI project and need to make a confident, informed decision." A question about "how does mRNA work" might mean "I want to understand this well enough to evaluate news/claims about mRNA vaccines." Identify the actionable goal behind the curiosity.

2. MAP THE KNOWLEDGE LANDSCAPE
   Identify every meaningful dimension that a true domain expert would consider. Think about:
   - The CORE MECHANICS: How does the thing fundamentally work? What are the underlying principles?
   - The PRACTICAL REALITY: What does it look like in practice? What are real-world constraints, costs, timelines?
   - The DECISION SPACE: What are the alternatives, tradeoffs, and criteria for choosing between them?
   - The RISK SURFACE: What can go wrong? What are common mistakes, misconceptions, or hidden pitfalls?
   - The TEMPORAL DIMENSION: Has this changed recently? Is the landscape shifting? Are there emerging trends?
   - The ECOSYSTEM: Who are the key players, communities, or authorities? What tools/platforms/resources exist?
   - The EDGE CASES: What non-obvious factors could significantly affect the outcome? (regulatory, cultural, technical debt, etc.)
   
   Only include dimensions that are genuinely relevant — forcing irrelevant categories weakens the research.

3. IDENTIFY BLIND SPOTS
   What would the user almost certainly need to know but is unlikely to have thought of? These are the insights that separate a surface-level answer from a genuinely valuable one. Examples:
   - Someone asking about "starting a SaaS business" probably hasn't thought about churn modeling or SOC 2 compliance
   - Someone asking about "learning guitar" probably hasn't considered the ergonomic injury risks of bad posture
   - Someone asking about "investing in real estate" probably hasn't factored in property management overhead or local tax implications

4. DEFINE WHAT SUCCESS LOOKS LIKE
   In 1-2 sentences, describe what a genuinely complete and useful answer would need to contain. This becomes the standard the rest of the pipeline optimizes toward.

OUTPUT FORMAT:

RESEARCH OBJECTIVE: [1-2 sentences — the deep, actionable intent behind the query]

KNOWLEDGE DIMENSIONS:
- [Dimension Name]: [1 sentence explaining why this dimension matters for this specific query]
- [Dimension Name]: [1 sentence explaining why this dimension matters for this specific query]
...

BLIND SPOTS TO INVESTIGATE:
- [Non-obvious factor the user likely hasn't considered, with a brief note on why it matters]
- [Non-obvious factor]
...

SUCCESS CRITERIA: [What the final research output must contain to fully satisfy the user's real need]

RULES:
- Do NOT generate sub-questions or a numbered list of things to search. That is handled by a separate agent.
- Be maximally specific to THIS query. Generic dimension names like "Cost" or "Risks" are only useful if you explain what specific costs or risks matter here and why.
- Write tight, information-dense prose. No filler, no preamble, no meta-commentary about your process.
- Every dimension and blind spot must earn its place — if it wouldn't meaningfully change the quality of the research output, cut it.
- If the query is genuinely ambiguous (missing critical context like budget, timeline, skill level, or geography), state your working assumptions in a single "ASSUMPTIONS" line at the top so research can proceed without blocking.`,
    },
    {
      role: 'user',
      content: `User's Question: "${state.problem}"${existingQuestionsBlock}`,
    },
  ]);

  logger.log('Refined Question: ', response.content);

  return {
    problem: response.content.toString(),
    aiCalls: 1,
  };
};

const makeQuestions = async (state: typeof GraphState.State) => {
  console.log('Generating Atomic Search Questions...');
  const response = await strongModel.invoke([
    {
      role: 'system',
      content: `You are a Senior Research Analyst. 
Your task is to break down a complex research objective into exactly 3-5 atomic, searchable sub-questions.

Guidelines:
1. Each question must be answerable using a single Google search.
2. The questions should cover different facets of the main objective (e.g., technical details, current state, historical context, key players).
3. Output ONLY the questions, one per line.
4. Do not use numbers or bullet points like '1.' or '-'. 
5. Do not include any introductory or concluding text.
6. Do not include questions that have already been answered.

Existing Questions that Have Been Answered:
${state.questions.map((q) => `- ${q.question}`).join('\n')}
    `,
    },
    { role: 'user', content: state.problem },
  ]);

  // Robust parsing: filter out empty lines and trim whitespace
  const rawContent = response.content.toString();
  const questions = rawContent
    .split('\n')
    .map((q) => q.replace(/^[\d\s\-\.\*]+/, '').trim()) // Remove leading numbers, dots, dashes, stars
    .filter((q) => q.length > 10); // Look for reasonable length sentences

  if (questions.length === 0) {
    console.warn('Warning: No questions extracted from raw output:', response);
  }

  logger.log('Generated Questions');
  logger.log(questions);

  // Add Questions to DB
  await Promise.all(
    questions.map(async (question) => {
      await addQuestion(question, state.topicId);
    })
  );

  return {
    questions: questions.map((question) => {
      return {
        question: question,
        data: {
          information: '',
          references: [],
        },
      };
    }),
    aiCalls: 1,
  };
};

/*
This node will turn each question into a search query, and then from the sources of the results choose what articles are useful and extract the information
*/
const researcher = async (state: typeof GraphState.State) => {
  console.log('Researching...');
  const questions = state.questions;
  let callCount = 0;

  console.log('Researching Internet...');

  const collectedData = new Set<Data>();
  let i = 0;
  for (const question of questions) {
    console.log(`Researching ${i + 1} of ${questions.length} questions...`);

    // Skip questions that already have data
    if (question.data.information) continue;

    const properQuestion = await lightModel.invoke([
      {
        role: 'system',
        content:
          'You are a Senior Research Analyst. Turn the given question into a single, highly effective Google search query. Output ONLY the query string.',
      },
      { role: 'user', content: question.question },
    ]);
    callCount++;

    const properQuestionContent = properQuestion.content
      .toString()
      .trim()
      .replace(/^["']|["']$/g, '');
    console.log(`Query for "${question.question.slice(0, 30)}...": ${properQuestionContent}`);

    const results = await generalSearch(properQuestionContent);
    if (results.length === 0) return [];

    // 2. Identify useful sources
    const usefulSources = await strongModel.invoke([
      {
        role: 'system',
        content: `Analyze these search results for the question: "${question.question}". 
  Return a JSON array of indices (e.g., [0, 2]) for the most relevant sources. 
  Output ONLY the array.`,
      },
      {
        role: 'user',
        content: JSON.stringify(
          results.map((result, i) => `[${i}] ${result.title}: ${result.content}`)
        ),
      },
    ]);
    callCount++;

    // Robust JSON parsing for indices
    let usefulSourcesContent: number[] = [];
    try {
      const match = usefulSources.content.toString().match(/\[[\d,\s]+\]/);
      usefulSourcesContent = match ? JSON.parse(match[0]) : [];
    } catch (e) {
      logger.warn('Could not parse source indices, defaulting to first 2.', e);
      usefulSourcesContent = [0, 1].filter((i) => i < results.length);
    }

    console.log('Useful Source Indices:', usefulSourcesContent);

    // 3. Extract content from selected sources
    for (const index of usefulSourcesContent) {
      if (!results[index]) return null;
      const content = await getLinkContent(results[index].url);
      if (content) {
        let exists = false;
        for (const d of collectedData) {
          if (d.references.includes(results[index].url)) {
            exists = true;
            break;
          }
        }
        if (exists) continue;

        collectedData.add({
          information: content,
          references: [results[index].url],
        });

        // Add source to DB topic
        await addSource(results[index].title, results[index].url, state.topicId);
      }
    }

    i++;
  }

  console.log('Finished Researching Internet... Collecting');

  return {
    collectedData: Array.from(collectedData),
    aiCalls: callCount,
  };
};

/*
This conditional edge will access the information and figure out if the data we have is enough to answer the question, if yes it will move to the synthesiser node, otherwise it will go back to the question generator to generate more questions.
*/
const checkSufficiency = async (state: typeof GraphState.State) => {
  console.log('Checking Sufficiency...');

  // If we already have 5 sets of collected data, we have enough
  if (state.collectedData.length >= 5) {
    return 'synthesiser';
  }

  const response = await strongModel.invoke([
    {
      role: 'system',
      content: `You are a Senior Research Analyst.
Your task is to determine if the following data is sufficient to answer the question: "${state.problem}".
Output only "Yes" if it is sufficient, and "No" if it is not.`,
    },
    {
      role: 'user',
      content: JSON.stringify(state.collectedData.map((data) => data.information)),
    },
  ]);

  const responseContent = response.content.toString().trim();

  // Logic to determine if we have enough data to answer the problem
  if (responseContent.toLowerCase().includes('yes')) {
    return 'synthesiser';
  }

  // If not enough, go back to makeQuestions
  logger.log('Not enough info... generating more questions');
  return 'makeQuestions';
};

/*
This node will take the collected information and synthesize it into a coherent answer to the original question.
It uses RAG (Retrieval-Augmented Generation) to handle large amounts of data.
*/
const synthesiser = async (state: typeof GraphState.State) => {
  logger.log('Synthesizing final report with RAG...');

  const embeddings = textEmbeddingModel;

  // 1. Chunk the collected data
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });

  const docsToIndex: Document[] = [];
  for (const [index, data] of state.collectedData.entries()) {
    const chunks = await textSplitter.splitText(data.information);
    for (const chunk of chunks) {
      docsToIndex.push(
        new Document({
          pageContent: chunk,
          metadata: { sourceIndex: index, url: data.references[0] },
        })
      );
    }
  }

  console.log(
    `Indexing ${docsToIndex.length} chunks from ${state.collectedData.length} sources...`
  );
  const vectorStore = await MemoryVectorStore.fromDocuments(docsToIndex, embeddings);

  // 2. Retrieve the most relevant chunks for the original problem
  console.log('Retrieving relevant snippets...');
  const relevantDocs = await vectorStore.similaritySearch(state.problem, 10);

  const context = relevantDocs
    .map((doc) => {
      return `Source [${doc.metadata.sourceIndex}] (${doc.metadata.url}):\n${doc.pageContent}`;
    })
    .join('\n\n---\n\n');

  // 3. Generate the final report
  const response = await strongModel.invoke([
    {
      role: 'system',
      content: `You are a World-Class Technical Writer. 
Your task is to take the provided research snippets and synthesize them into a STUNNING, user-friendly research report in MARKDOWN.

Design Guidelines:
1. Use a clean, modern hierarchy (H1 for Title, H2 for Sections, H3 for sub-points).
2. Start with an "Executive Summary" that is approachable and highlights the "Final Verdict" in a blockquote.
3. Use Horizontal Rules (---) to separate major sections for visual clarity.
4. Use Bullet Points and Bold text liberally to make the report "scannable."
5. If there are pros/cons or comparisons, use Markdown Tables.
6. Use Citations like [0], [1] and list the URLs at the bottom as a "Bibliography."

Tone: Professional but engaging. Avoid being overly dry or academic. Focus on providing real value and answering the user's core intent.`,
    },
    {
      role: 'user',
      content: `Original Intent: "${state.problem}"\n\nRelevant Research Snippets:\n\n${context}`,
    },
  ]);

  const reportMarkdown = response.content.toString().toString();

  logger.log(`FINAL REPORT: ${reportMarkdown}`);

  // Add Final Report to DB
  await updateTopic(state.topicId, { summary: reportMarkdown });

  return {
    finalReport: reportMarkdown,
    aiCalls: 1,
  };
};

// --- Build the Graph ---
export const summaryResearchAgent = new StateGraph(GraphState)
  .addNode('questionRefine', questionRefine)
  .addNode('makeQuestions', makeQuestions)
  .addNode('researcher', researcher)
  .addNode('synthesiser', synthesiser)
  .addEdge(START, 'questionRefine')
  .addEdge('questionRefine', 'makeQuestions')
  .addEdge('makeQuestions', 'researcher')
  .addConditionalEdges('researcher', checkSufficiency, ['synthesiser', 'makeQuestions'])
  .addEdge('synthesiser', END)
  .compile();
