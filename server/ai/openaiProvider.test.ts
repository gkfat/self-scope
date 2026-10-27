import {
    describe, expect, it, vi,
} from 'vitest';
import type OpenAI from 'openai';
import { OpenAiReportProvider } from './openaiProvider';
import { AiOutputError } from './provider';
import type { AnalysisInput } from '../../shared/schemas/firestore/detailedReport.schema';

const input: AnalysisInput = {
    inputVersion: 'v',
    bazi: null,
    mayaKin: null,
    profile: {
        zodiac: 'leo', bloodType: null, mbti: 'ENFP', numerology: null,
    },
    test: null,
    humanDesign: null,
};

const parsed = { sections: [] };

const completion = (choice: Record<string, unknown> = {}) => ({
    model: 'gpt-5-mini-2025-08-07',
    usage: {
        prompt_tokens: 900, completion_tokens: 2500,
    },
    choices: [
        {
            finish_reason: 'stop',
            message: {
                parsed, refusal: null,
            },
            ...choice,
        },
    ],
});

function providerWith(response: unknown) {
    const parse = vi.fn(async () => response);
    const client = { chat: { completions: { parse } } } as unknown as Pick<OpenAI, 'chat'>;

    return {
        parse,
        provider: new OpenAiReportProvider({
            client, model: 'gpt-5-mini', maxOutputTokens: 4000,
        }),
    };
}

const signal = () => new AbortController().signal;

describe('OpenAiReportProvider', () => {
    it('returns the parsed report with token usage and the model that answered', async () => {
        const { provider } = providerWith(completion());

        expect(await provider.generate(input, { signal: signal() })).toEqual({
            output: parsed,
            usage: {
                inputTokens: 900, outputTokens: 2500,
            },
            modelName: 'gpt-5-mini-2025-08-07',
        });
    });

    it('asks for the configured model, the output cap, minimal reasoning and the report schema', async () => {
        const {
            provider, parse,
        } = providerWith(completion());
        const controller = new AbortController();

        await provider.generate(input, { signal: controller.signal });

        const [params, requestOptions] = parse.mock.calls[0] as unknown as [Record<string, unknown>, Record<string, unknown>];

        expect(params).toMatchObject({
            model: 'gpt-5-mini',
            max_completion_tokens: 4000,
            reasoning_effort: 'minimal',
        });
        expect((params.response_format as { type: string }).type).toBe('json_schema');
        expect(requestOptions.signal).toBe(controller.signal);
    });

    it('sends the facts to the model, with no secrets or ids', async () => {
        const {
            provider, parse,
        } = providerWith(completion());

        await provider.generate(input, { signal: signal() });

        const [params] = parse.mock.calls[0] as unknown as [{ messages: Array<{ role: string; content: string }> }];
        const prompt = params.messages.find((message) => message.role === 'user')?.content ?? '';

        expect(prompt).toContain('"zodiac": "leo"');
        expect(prompt).not.toMatch(/uid|email|apiKey/i);
    });

    it.each([
        [
            'refusal text',
            {
                message: {
                    parsed: null, refusal: 'no', 
                }, 
            },
            'REFUSED',
        ],
        [
            'content_filter',
            { finish_reason: 'content_filter' },
            'REFUSED',
        ],
        [
            'length',
            { finish_reason: 'length' },
            'TRUNCATED',
        ],
        [
            'no parsed content',
            {
                message: {
                    parsed: null, refusal: null, 
                }, 
            },
            'UNPARSEABLE',
        ],
    ])('treats %s as an unusable answer (%s)', async (_name, choice, reason) => {
        const { provider } = providerWith(completion(choice));

        await expect(provider.generate(input, { signal: signal() })).rejects.toMatchObject({ reason });
    });

    it('treats a response without choices or usage as unusable', async () => {
        const { provider: noChoices } = providerWith({
            ...completion(), choices: [],
        });
        const { provider: noUsage } = providerWith({
            ...completion(), usage: undefined,
        });

        await expect(noChoices.generate(input, { signal: signal() })).rejects.toBeInstanceOf(AiOutputError);
        await expect(noUsage.generate(input, { signal: signal() })).rejects.toBeInstanceOf(AiOutputError);
    });

    it('lets API errors through so the caller can fail and refund', async () => {
        const client = {
            chat: {
                completions: {
                    parse: vi.fn(async () => {
                        throw new Error('overloaded');
                    }),
                },
            },
        } as unknown as Pick<OpenAI, 'chat'>;
        const provider = new OpenAiReportProvider({
            client, model: 'm', maxOutputTokens: 1,
        });

        await expect(provider.generate(input, { signal: signal() })).rejects.toThrow('overloaded');
    });
});
