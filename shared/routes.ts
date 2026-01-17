import { z } from 'zod';
import { insertTenderSchema, tenders } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  tenders: {
    list: {
      method: 'GET' as const,
      path: '/api/tenders',
      input: z.object({
        search: z.string().optional(),
        location: z.string().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof tenders.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tenders/:id',
      responses: {
        200: z.custom<typeof tenders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tenders',
      input: insertTenderSchema,
      responses: {
        201: z.custom<typeof tenders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type TenderInput = z.infer<typeof api.tenders.create.input>;
export type TenderResponse = z.infer<typeof api.tenders.create.responses[201]>;
