import { z } from 'zod';

export const DELETE_DATA_SCOPES = [
    'RESULTS',
    'SUMMARIES',
    'REPORTS',
    'HUMAN_DESIGN',
] as const;

export const deleteDataScopeSchema = z.enum(DELETE_DATA_SCOPES);

/** At least one scope must be named; deleting "everything" is the account deletion endpoint. */
export const deleteDataRequestSchema = z.object({ scopes: z.array(deleteDataScopeSchema).min(1) });

export const deleteResultSchema = z.object({ deleted: z.array(z.string()) });

export type DeleteDataScope = z.infer<typeof deleteDataScopeSchema>;
export type DeleteDataRequest = z.infer<typeof deleteDataRequestSchema>;
export type DeleteResult = z.infer<typeof deleteResultSchema>;
