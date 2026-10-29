import type {
    MultiAnalysisInput, MultiAnalysisOutput,
} from '../../shared/schemas/firestore/multiAnalysis.schema';
import type {
    SingleAnalysisInput, SingleAnalysisOutput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';

/**
 * What the app needs from an AI service. Only the OpenAI implementation exists;
 * nothing above this file depends on which model answers.
 */
export type AiGeneration<Output> = {
    output: Output;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    modelName: string;
};

export type GenerateOptions = {
    /** Aborted when the attempt runs out of time. */
    signal: AbortSignal;
};

export type AiSingleGeneration = AiGeneration<SingleAnalysisOutput>;

export type AiMultiGeneration = AiGeneration<MultiAnalysisOutput>;

/** The AI analysis of a kept report: one system's, or the rewriting of what the insight rules found across several (see `SingleAnalysisService`). */
export type AiSingleAnalysisProvider = {
    generateSingle(input: SingleAnalysisInput, options: GenerateOptions): Promise<AiSingleGeneration>;
    generateMulti(input: MultiAnalysisInput, options: GenerateOptions): Promise<AiMultiGeneration>;
};

/**
 * The model answered, but not with a usable report (refusal, cut off, or not parseable).
 * `reason` is safe to store and show; it never contains model output.
 */
export class AiOutputError extends Error {
    readonly reason: 'REFUSED' | 'TRUNCATED' | 'UNPARSEABLE';

    constructor(reason: AiOutputError['reason']) {
        super(`AI output unusable: ${reason}`);
        this.name = 'AiOutputError';
        this.reason = reason;
    }
}
