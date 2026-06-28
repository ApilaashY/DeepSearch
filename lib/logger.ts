export class Logger {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private assembleMessage(message: unknown) {
    return `[${this.prefix}] - ${message}`;
  }

  log(message: unknown, data?: unknown) {
    console.log(this.assembleMessage(message), data);
  }
  error(error: unknown, data?: unknown) {
    console.error(this.assembleMessage(error), data);
  }
  warn(message: unknown, data?: unknown) {
    console.warn(this.assembleMessage(message), data);
  }
}
