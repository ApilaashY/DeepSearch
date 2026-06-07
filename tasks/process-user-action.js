// The task must be exported as the default function
export default async function processUserAction(payload, helpers) {
  const { id, email, action } = payload;

  await new Promise((resolve) => setTimeout(() => resolve(), 8000));

  // Use the built-in logger to keep track of tasks
  helpers.logger.info(`Starting background work for User #${id}`);

  if (!email) {
    // Throwing an error automatically triggers a retry strategy
    throw new Error('Cannot process task without a valid user email address');
  }

  // Put your heavy work here (e.g., calling third-party APIs, image resizing)
  helpers.logger.info(`Successfully finished action "${action}" for ${email}`);
}
