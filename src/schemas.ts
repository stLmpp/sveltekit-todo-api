import { z } from 'zod';

export const TodoAddSchema = z.object({
  description: z.string().trim().max(100),
  completed: z.boolean().optional(),
});

export const TodoUpdateSchema = z.object({
  description: z.string().trim().max(100).optional(),
  completed: z.boolean().optional(),
});

export const TodoSchema = z.object({
  id: z.string(),
  description: z.string().trim().max(100),
  completed: z.boolean(),
});

export type Todo = z.infer<typeof TodoSchema>;
export type TodoAdd = z.infer<typeof TodoAddSchema>;
export type TodoUpdate = z.infer<typeof TodoUpdateSchema>;
