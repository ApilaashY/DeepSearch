export class Logger {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private assembleMessage(message: any) {
    return `[${this.prefix}] - ${message}`;
  }

  log(message: any) {
    console.log(this.assembleMessage(message));
  }
  error(error: any, data?: any) {
    console.error(this.assembleMessage(error), data);
  }
  warn(message: any) {
    console.warn(this.assembleMessage(message));
  }
}
