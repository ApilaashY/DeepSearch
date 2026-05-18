import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export class ModelQueuer {
    private model: BaseChatModel;
    private queue: { input: BaseLanguageModelInput; resolve: (val: any) => void }[] = [];
    private isProcessing = false;

    constructor(model: BaseChatModel) {
        this.model = model;
    }

    async invoke(messages: BaseLanguageModelInput) {
        // Instead of calling the model here, we wrap the request in a Promise
        // and add it to our queue array.
        return new Promise((resolve) => {
            this.queue.push({ input: messages, resolve });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            // The "if (item)" check fixes the TypeScript "undefined" error
            if (item) {
                const response = await this.model.invoke(item.input);
                item.resolve(response);
            }
        }

        this.isProcessing = false;
    }
}
