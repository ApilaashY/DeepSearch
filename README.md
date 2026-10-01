# SuDeep | DeepSearch

**An AI research console for turning open-ended topics into structured, source-linked research.**

DeepSearch gives a research question room to breathe. Start with a topic, add the questions or URLs you already care about, and launch a background research run. A LangGraph workflow expands the scope, identifies useful search avenues, gathers and ranks web results, retrieves relevant passages, and writes a Markdown report that is saved with the topic.

Instead of treating research as one prompt and one answer, DeepSearch makes the work visible: topics, questions, sources, processing status, and the final report live together in a persistent workspace. The model and search layers are built from replaceable services, with support for Gemini or locally hosted Ollama chat models and Tavily web search.

## What It Does

- **Organizes research by topic.** Create a topic, describe what you want to learn, and keep related questions and sources together.
- **Expands the research objective.** The research agent considers intent, important dimensions, blind spots, and the user's existing questions before searching.
- **Breaks broad topics into searchable questions.** The agent generates focused subquestions and saves them against the topic.
- **Searches and evaluates the web.** Tavily returns advanced search results; a language model chooses relevant results, and Tavily extracts their page content.
- **Uses sources you provide.** Existing source URLs are fetched at the beginning of a run and added to the research context.
- **Checks whether it has enough evidence.** Retrieved passages are evaluated for sufficiency; if the evidence is inadequate, the workflow generates further questions and researches again.
- **Synthesizes a readable report.** Source text is split into overlapping chunks, embedded, and searched for passages relevant to the topic. The report is generated in Markdown with citations and a bibliography prompt, then saved as the topic summary.
- **Keeps long-running work out of the web request.** Graphile Worker runs the research workflow as a background job, while the UI displays whether research is in progress.
- **Offers a workspace for reviewing results.** Browse topic summaries, questions, and source records from a responsive sidebar and topic view.

## How a Research Run Works

1. Create a topic and add a description. You can also add questions or source URLs to guide the run.
2. Start **Perform Research Analysis**. The app queues a Graphile Worker job rather than holding the browser request open for the full research run.
3. The worker loads the topic, its questions, and its sources. LangGraph refines the objective and generates atomic search questions.
4. For each question, the workflow creates a search query, requests up to eight advanced Tavily results, selects relevant results, extracts page content, and records source URLs in PostgreSQL.
5. Source content is split into chunks of 800 characters with 150 characters of overlap, embedded using Ollama's `nomic-embed-text` model, and indexed in an in-memory vector store for the run.
6. The workflow retrieves relevant passages and asks the model whether the collected evidence is sufficient. If not, it returns to question generation and research.
7. A final Markdown report is synthesized from retrieved passages, including source citation instructions, and stored in the topic's summary field.

```mermaid
flowchart TD
	A[Topic, questions, and URLs] --> B[Queue Graphile Worker job]
	B --> C[Refine research objective]
	C --> D[Generate search questions]
	D --> E[Tavily search and content extraction]
	E --> F[Chunk and embed source content]
	F --> G{Evidence sufficient?}
	G -- No --> D
	G -- Yes --> H[Retrieve relevant passages]
	H --> I[Generate Markdown report]
	I --> J[Save report and sources in PostgreSQL]
```

## Product Tour

- **Research Console:** Navigate between topics and create a new research workspace.
- **Topic page:** Edit the topic description, add questions or sources, launch research, and read the generated summary.
- **Question page:** Review or edit an individual question and inspect its associated details.
- **Source page:** Review a source record and open its URL.
- **Background status:** The topic view refreshes while a research job is running and reflects the saved summary when it is ready.

The current topic-level research flow is the primary implemented AI experience. Individual question-generation and source-summarization buttons are placeholders and are not connected to backend agents yet.

## Technology

| Area                     | Technologies                                                |
| ------------------------ | ----------------------------------------------------------- |
| Web application          | Next.js App Router, React, TypeScript                       |
| Styling and UI           | Tailwind CSS, React Icons, React Markdown                   |
| Client state             | Redux Toolkit, React Redux                                  |
| Research orchestration   | LangChain, LangGraph                                        |
| Chat models              | Google Gemini by default, or Ollama chat models             |
| Search and extraction    | Tavily Search and Extract APIs                              |
| Embeddings and retrieval | Ollama `nomic-embed-text`, LangChain in-memory vector store |
| Persistence              | PostgreSQL, Prisma                                          |
| Background jobs          | Graphile Worker                                             |
| Packaging and deployment | Docker, Docker Compose, Kubernetes manifests                |

## Architecture

The application has three cooperating parts:

- **Next.js web app:** Serves the research console, topic/question/source pages, and JSON API routes.
- **PostgreSQL database:** Stores topics, nested questions, source records, generated summaries, and Graphile Worker jobs.
- **Graphile Worker process:** Executes `summary-research` jobs and invokes the LangGraph topic workflow. Its task implementation is in `tasks/summary-research.js` and its graph is in `lib/workflow/topic.ts`.

The research workflow is defined as a graph of focused nodes: fetch existing sources, refine the objective, make questions, research the web, check sufficiency, and synthesize the report. State is shared across nodes during a run; the resulting summary and source/question records are persisted through Prisma.

## Getting Started

### Prerequisites

- Node.js 24 and npm (the Docker images use Node 24).
- A reachable PostgreSQL database.
- A Tavily API key for web search and page extraction.
- An Ollama server with the `nomic-embed-text` embedding model available. Ollama embeddings are used even when Gemini is selected for chat.
- A Google AI API key for the default Gemini chat models, or the chat models listed in the Ollama configuration below.

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment variables

Create a `.env` file in the repository root:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
TAVILY_API_KEY="your-tavily-api-key"
GOOGLE_API_KEY="your-google-ai-api-key"
OLLAMA_BASE_URL="http://localhost:11434"
# Optional: set to "ollama" to use local Ollama chat models instead of Gemini.
AI_MODEL="gemini"
```

Keep real credentials out of source control. The worker development command explicitly loads `.env`, so the file must exist before running `npm run dev`.

`AI_MODEL` selects the chat provider: when its value is `ollama`, the workflow uses `deepseek-r1:8b` and `qwen3:30b`; otherwise it uses Gemini. The workflow uses Ollama's `nomic-embed-text` for embeddings in either mode. `OLLAMA_BASE_URL` defaults in code to `http://host.docker.internal:11434`; set it to the address reachable from your environment (commonly `http://localhost:11434` for a local development machine).

### 3. Prepare PostgreSQL and Ollama

Create the database named in `DATABASE_URL`, then synchronize the Prisma schema:

```bash
npm run db:push
```

Start Ollama and download the embedding model:

```bash
ollama pull nomic-embed-text
```

If using Ollama for chat as well, pull the configured chat models:

```bash
ollama pull deepseek-r1:8b
ollama pull qwen3:30b
```

Ensure the Ollama server is reachable at `OLLAMA_BASE_URL`. The Ollama chat models may require substantial memory; choose a machine and model configuration that can run them.

### 4. Start the web app and worker

```bash
npm run dev
```

This starts the Next.js development server and Graphile Worker together. Open [http://localhost:3000](http://localhost:3000), create a topic, add a description, and run a research analysis.

To run the processes separately, use two terminals:

```bash
npm run next:dev
```

```bash
npm run worker:dev
```

The worker requires a reachable PostgreSQL database and the same provider configuration as the web app.

## Configuration Reference

| Variable          | Required                                      | Purpose                                                                                           |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Yes                                           | PostgreSQL connection used by Prisma and Graphile Worker.                                         |
| `TAVILY_API_KEY`  | Yes for web research                          | Authenticates search and page extraction requests to Tavily.                                      |
| `GOOGLE_API_KEY`  | Yes when using Gemini                         | Authenticates Gemini chat model requests.                                                         |
| `AI_MODEL`        | No                                            | Set to `ollama` for Ollama chat models; any other or unset value selects Gemini.                  |
| `OLLAMA_BASE_URL` | Required for embeddings; also for Ollama chat | Ollama server URL. Defaults to `http://host.docker.internal:11434` in the workflow configuration. |

## API Surface

The Next.js app exposes JSON routes for the main application records and for queuing research:

| Method | Route                    | Purpose                                       |
| ------ | ------------------------ | --------------------------------------------- |
| `GET`  | `/api/topic/get`         | List topics and their associated data.        |
| `GET`  | `/api/topic/get/[id]`    | Retrieve a topic by ID.                       |
| `POST` | `/api/topic/create`      | Create a topic.                               |
| `POST` | `/api/topic/update`      | Update a topic description.                   |
| `POST` | `/api/question/add`      | Add a question to a topic or parent question. |
| `GET`  | `/api/question/get/[id]` | Retrieve a question by ID.                    |
| `POST` | `/api/question/update`   | Update question details.                      |
| `POST` | `/api/source/add`        | Add a source record.                          |
| `GET`  | `/api/source/get/[id]`   | Retrieve a source by ID.                      |
| `POST` | `/api/graphile/queue`    | Queue a topic research job.                   |

## Project Layout

```text
ai/                     Standalone AI research prototype and Tavily helpers
app/                    Next.js pages, UI components, and API routes
lib/operations/         Prisma-backed topic, question, and source operations
lib/workflow/           LangGraph research workflow, model configuration, search
lib/redux/              Redux Toolkit store, hooks, and topic state
prisma/schema.prisma    PostgreSQL data model
tasks/                  Graphile Worker task entry points
docker/                 Web and worker Dockerfiles
k8s/                    Kubernetes deployment, service, and ingress manifests
```

The production topic workflow lives in `lib/workflow/topic.ts`. The separate `ai/` directory contains an earlier standalone research-agent implementation and should not be confused with the worker-backed topic workflow used by the app.

## Build and Deployment

Build the app locally:

```bash
npm run build
npm run start
```

The build script generates the Prisma client before building Next.js. The production web app listens on port 3000 by default.

Dockerfiles are provided for the web app (`docker/Dockerfile`) and Graphile Worker (`docker/Dockerfile.worker`). The Docker Compose file runs both services and expects PostgreSQL and Ollama to be reachable from the containers; it does not start those dependencies. Its database host/port and default Ollama URL are configured for the repository's local deployment setup, so review and adjust `docker-compose.yml` for your environment.

The Kubernetes manifest currently defines a web deployment, service, and ingress. It is a starting point rather than a complete production deployment: configure secrets and database/provider connectivity for your cluster, and deploy a worker process separately so queued research jobs are consumed.

## Current Status and Limitations

- **No authentication or user isolation is implemented.** The topic API currently returns project topics without per-user authorization. Do not expose this deployment to untrusted users or store sensitive research until access control is added.
- **Question and source agent actions are unfinished.** Their UI contains placeholder actions; the implemented research run is launched from a topic.
- **Automated tests are not configured.** The `npm test` script is currently a placeholder and exits successfully without running a test suite.
- **Research depends on external services.** Tavily, the selected chat model provider, PostgreSQL, Graphile Worker, and Ollama embeddings must be configured and available for a complete run.
- **Retrieval storage is per-run and in memory.** Source records and reports persist in PostgreSQL, but the vector index is built for an individual workflow run rather than retained as a durable vector database.
- **Schema setup uses Prisma `db push`.** The development and Docker workflows synchronize the schema directly; review the database migration strategy before using this setup for production data.

## Useful Commands

| Command               | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Start Next.js and Graphile Worker for development.        |
| `npm run next:dev`    | Start only the Next.js development server.                |
| `npm run worker:dev`  | Start only the Graphile Worker process using `.env`.      |
| `npm run build`       | Generate Prisma Client and build the Next.js app.         |
| `npm run start`       | Serve the production Next.js build.                       |
| `npm run lint`        | Run ESLint.                                               |
| `npm run db:push`     | Synchronize the Prisma schema to the configured database. |
| `npm run db:generate` | Generate Prisma Client.                                   |
| `npm run image:build` | Build the web Docker image.                               |
| `npm run image:push`  | Push the configured web image tag.                        |
