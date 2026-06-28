// The task must be exported as the default function
export default async function processUserAction(payload, helpers) {
  const { id, email, action } = payload;

  helpers.logger.info(
    `Starting background work for User #${id || 'unknown'} - Action: ${
      action || 'Perform Research'
    }`
  );

  const iterations = 18; // 90 seconds total / 5 seconds interval
  const delayMs = 5000;

  for (let i = 1; i <= iterations; i++) {
    const elapsedSeconds = i * 5;

    // Construct a 3-line string to print
    const message =
      `[Line 1] Graphile Worker iteration: ${i}/${iterations}\n` +
      `[Line 2] Status: Research task in progress...\n` +
      `[Line 3] Time Elapsed: ${elapsedSeconds}s / 90s`;

    helpers.logger.info(message);

    if (i < iterations) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  helpers.logger.info(`Successfully finished action "${action || 'Perform Research'}"`);
}
