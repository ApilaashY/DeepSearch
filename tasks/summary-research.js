import { summaryResearchAgent } from '../lib/workflow/topic';
import { getTopic } from '../lib/operations/topic/getTopic';
import { Logger } from '../lib/logger';
import { updateTopic } from '../lib/operations/topic/updateTopic';

const logger = new Logger('Summary Research Task');

export default async function summaryResearch(payload) {
  const { topicId } = payload;

  // Set pending to true
  console.log(await updateTopic(topicId, { ai_pending: true }));

  logger.log('Fetching topic...');
  // Get existing questions
  const { questions, description } = await getTopic(topicId, {
    description: true,
    questions: true,
  });

  logger.log(`STARTING ANALYSIS FOR QUESTION: ${description}`);

  // Call summary agent
  await summaryResearchAgent.invoke({
    problem: description,
    questions: questions.map((q) => {
      return {
        question: q.title,
        data: {
          information: '',
          references: [],
        },
      };
    }),
    topicId: topicId,
  });

  // Set pending back to false
  await updateTopic(topicId, { ai_pending: false });
}
