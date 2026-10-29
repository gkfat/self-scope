import type OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
    AiOutputError, type AiGeneration, type AiReportProvider, type AiSingleAnalysisProvider, type AiSingleGeneration, type GenerateOptions,
} from './provider';
import {
    SINGLE_PROMPT_VERSION, buildSingleSystemPrompt, buildSingleUserPrompt,
} from './singlePrompt';
import {
    singleAnalysisOutputSchema, type SingleAnalysisInput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';
import {
    PROMPT_VERSION, buildSystemPrompt, buildUserPrompt,
} from './prompt';
import {
    aiReportOutputSchema, type AnalysisInput,
} from '../../shared/schemas/firestore/detailedReport.schema';

type OpenAiProviderOptions = {
    client: Pick<OpenAI, 'chat'>;
    model: string;
    maxOutputTokens: number;
};

/**
 * OpenAI via the official SDK. The response is constrained to the report schema
 * (structured outputs), then checked again by assessReport before anyone sees it.
 */
export class OpenAiReportProvider implements AiReportProvider, AiSingleAnalysisProvider {
    readonly promptVersion = PROMPT_VERSION;
    readonly singlePromptVersion = SINGLE_PROMPT_VERSION;

    private readonly client: Pick<OpenAI, 'chat'>;
    private readonly model: string;
    private readonly maxOutputTokens: number;

    constructor(options: OpenAiProviderOptions) {
        this.client = options.client;
        this.model = options.model;
        this.maxOutputTokens = options.maxOutputTokens;
    }

    async generate(input: AnalysisInput, options: GenerateOptions): Promise<AiGeneration> {
        const completion = await this.client.chat.completions.parse({
            model: this.model,
            // Reasoning tokens count against this cap, so keep reasoning minimal to leave room for the report.
            max_completion_tokens: this.maxOutputTokens,
            reasoning_effort: 'minimal',
            messages: [
                {
                    role: 'system', content: buildSystemPrompt(),
                }, {
                    role: 'user', content: buildUserPrompt(input),
                },
            ],
            response_format: zodResponseFormat(aiReportOutputSchema, 'detailed_report'),
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
}
