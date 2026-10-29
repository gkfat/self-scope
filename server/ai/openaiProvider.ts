import type OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
    AiOutputError, type AiMultiGeneration, type AiSingleAnalysisProvider, type AiSingleGeneration, type GenerateOptions,
} from './provider';
import {
    MULTI_PROMPT_VERSION, buildMultiSystemPrompt, buildMultiUserPrompt,
} from './multiPrompt';
import {
    SINGLE_PROMPT_VERSION, buildSingleSystemPrompt, buildSingleUserPrompt,
} from './singlePrompt';
import {
    multiAnalysisOutputSchema, type MultiAnalysisInput,
} from '../../shared/schemas/firestore/multiAnalysis.schema';
import {
    singleAnalysisOutputSchema, type SingleAnalysisInput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';

type OpenAiProviderOptions = {
    client: Pick<OpenAI, 'chat'>;
    model: string;
    maxOutputTokens: number;
};

/**
 * OpenAI via the official SDK. The response is constrained to the report schema
 * (structured outputs), then checked again by assessReport before anyone sees it.
 */
export class OpenAiReportProvider implements AiSingleAnalysisProvider {
    readonly singlePromptVersion = SINGLE_PROMPT_VERSION;
    readonly multiPromptVersion = MULTI_PROMPT_VERSION;

    private readonly client: Pick<OpenAI, 'chat'>;
    private readonly model: string;
    private readonly maxOutputTokens: number;

    constructor(options: OpenAiProviderOptions) {
        this.client = options.client;
        this.model = options.model;
        this.maxOutputTokens = options.maxOutputTokens;
    }

    async generateSingle(input: SingleAnalysisInput, options: GenerateOptions): Promise<AiSingleGeneration> {
        const completion = await this.client.chat.completions.parse({
            model: this.model,
            max_completion_tokens: this.maxOutputTokens,
            reasoning_effort: 'minimal',
            messages: [
                {
                    role: 'system', content: buildSingleSystemPrompt(),
                }, {
                    role: 'user', content: buildSingleUserPrompt(input),
                },
            ],
            response_format: zodResponseFormat(singleAnalysisOutputSchema, 'single_analysis'),
        }, { signal: options.signal });

        const choice = completion.choices[0];

        if (!choice || !completion.usage) throw new AiOutputError('UNPARSEABLE');
        if (choice.message.refusal || choice.finish_reason === 'content_filter') throw new AiOutputError('REFUSED');
        if (choice.finish_reason === 'length') throw new AiOutputError('TRUNCATED');
        if (!choice.message.parsed) throw new AiOutputError('UNPARSEABLE');

        return {
            output: choice.message.parsed,
            usage: {
                inputTokens: completion.usage.prompt_tokens,
                outputTokens: completion.usage.completion_tokens,
            },
            modelName: completion.model,
        };
    }

    async generateMulti(input: MultiAnalysisInput, options: GenerateOptions): Promise<AiMultiGeneration> {
        const completion = await this.client.chat.completions.parse({
            model: this.model,
            max_completion_tokens: this.maxOutputTokens,
            reasoning_effort: 'minimal',
            messages: [
                {
                    role: 'system', content: buildMultiSystemPrompt(),
                }, {
                    role: 'user', content: buildMultiUserPrompt(input),
                },
            ],
            response_format: zodResponseFormat(multiAnalysisOutputSchema, 'multi_analysis'),
        }, { signal: options.signal });

        const choice = completion.choices[0];

        if (!choice || !completion.usage) throw new AiOutputError('UNPARSEABLE');
        if (choice.message.refusal || choice.finish_reason === 'content_filter') throw new AiOutputError('REFUSED');
        if (choice.finish_reason === 'length') throw new AiOutputError('TRUNCATED');
        if (!choice.message.parsed) throw new AiOutputError('UNPARSEABLE');

        return {
            output: choice.message.parsed,
            usage: {
                inputTokens: completion.usage.prompt_tokens,
                outputTokens: completion.usage.completion_tokens,
            },
            modelName: completion.model,
        };
    }
}
