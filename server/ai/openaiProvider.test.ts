import {
    describe, expect, it, vi,
} from 'vitest';
import type OpenAI from 'openai';
import { OpenAiReportProvider } from './openaiProvider';
import { AiOutputError } from './provider';
import type { MultiAnalysisInput } from '../../shared/schemas/firestore/multiAnalysis.schema';
import type { SingleAnalysisInput } from '../../shared/schemas/firestore/singleAnalysis.schema';

const single: SingleAnalysisInput = {
    system: 'ZODIAC',
    position: '太陽獅子座',
    facts: ['太陽星座：獅子座'],
    facets: ['傾向「外放表達」'],
    notes: ['系統性質：傳統占星'],
};

const multi: MultiAnalysisInput = {
    systems: ['ZODIAC', 'BLOOD'],
    positions: ['太陽獅子座', 'O 型'],
    facts: ['血型：O 型'],
    candidates: [
        {
            id: 'convergence-order', text: '多個來源指向條理', hypothesis: '你的行程是否排得很整齊？', sources: ['blood:O'],
        },
    ],
    notes: [],
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

        expect(await provider.generateSingle(single, { signal: signal() })).toEqual({
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

        await provider.generateSingle(single, { signal: controller.signal });

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

        await provider.generateSingle(single, { signal: signal() });

        const [params] = parse.mock.calls[0] as unknown as [{ messages: Array<{ role: string; content: string }> }];
        const prompt = params.messages.find((message) => message.role === 'user')?.content ?? '';

        expect(prompt).toContain('太陽星座：獅子座');
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

        await expect(provider.generateSingle(single, { signal: signal() })).rejects.toMatchObject({ reason });
    });

    it('treats a response without choices or usage as unusable', async () => {
        const { provider: noChoices } = providerWith({
            ...completion(), choices: [],
        });
        const { provider: noUsage } = providerWith({
            ...completion(), usage: undefined,
        });

        await expect(noChoices.generateSingle(single, { signal: signal() })).rejects.toBeInstanceOf(AiOutputError);
        await expect(noUsage.generateSingle(single, { signal: signal() })).rejects.toBeInstanceOf(AiOutputError);
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

        await expect(provider.generateSingle(single, { signal: signal() })).rejects.toThrow('overloaded');
    });
});

describe('OpenAiReportProvider.generateMulti', () => {
    it('sends the candidates to the model and returns the parsed answer with token usage', async () => {
        const {
            provider, parse,
        } = providerWith(completion());

        const generation = await provider.generateMulti(multi, { signal: signal() });
        const [params] = parse.mock.calls[0] as unknown as [{ messages: Array<{ role: string; content: string }>; response_format: { type: string } }];
        const prompt = params.messages.find((message) => message.role === 'user')?.content ?? '';

        expect(generation).toMatchObject({
            output: parsed, usage: {
                inputTokens: 900, outputTokens: 2500,
            },
        });
        expect(prompt).toContain('convergence-order');
        expect(prompt).not.toMatch(/uid|email|apiKey/i);
        expect(params.response_format.type).toBe('json_schema');
    });

    it('treats a refusal or a cut-off answer as unusable', async () => {
        const { provider: refused } = providerWith(completion({
            message: {
                parsed: null, refusal: 'no',
            },
        }));
        const { provider: cut } = providerWith(completion({ finish_reason: 'length' }));

        await expect(refused.generateMulti(multi, { signal: signal() })).rejects.toMatchObject({ reason: 'REFUSED' });
        await expect(cut.generateMulti(multi, { signal: signal() })).rejects.toMatchObject({ reason: 'TRUNCATED' });
    });
});

