import type {
    AiReportOutput, AnalysisInput,
} from '../../shared/schemas/firestore/detailedReport.schema';
import type {
    SingleAnalysisInput, SingleAnalysisOutput,
} from '../../shared/schemas/firestore/singleAnalysis.schema';

/**
 * What the app needs from an AI service. Only the OpenAI implementation exists;
 * nothing above this file depends on which model answers.
 */
export type AiGeneration = {
    output: AiReportOutput;
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

export type AiReportProvider = {
    generate(input: AnalysisInput, options: GenerateOptions): Promise<AiGeneration>;
};

export type AiSingleGeneration = Omit<AiGeneration, 'output'> & { output: SingleAnalysisOutput };

/** The AI analysis of one system's report (see `SingleAnalysisService`). */
export type AiSingleAnalysisProvider = {
    generateSingle(input: SingleAnalysisInput, options: GenerateOptions): Promise<AiSingleGeneration>;
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
