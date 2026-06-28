import { addQuestion } from '../lib/operations/question/addQuestion';

export default async function summaryResearch(payload, helpers) {
  const { topicId } = payload;

  helpers.logger.info(`Starting background work for Topic #${topicId}`);

  for (let i = 0; i < 5; i++) {
    // Calling addQuestion with proper arguments: title, parentId, isTopic
    await addQuestion(`Automated Research Question ${i + 1}`, topicId, true);
    helpers.logger.info(`Successfully finished action "Add Question ${i + 1}"`);
    await new Promise((resolve) => setTimeout(resolve, 7000));
  }

  helpers.logger.info(`Successfully finished all background work for Topic #${topicId}`);
}
