import { z } from 'zod';

const DescriptionSchema = z.string().trim().max(500);
const TitleSchema = z.string().trim().max(100);

export const TodoAddSchema = z.object({
  title: TitleSchema,
  description: DescriptionSchema.optional(),
  completed: z.boolean().optional(),
});

export const TodoUpdateSchema = z.object({
  description: DescriptionSchema.optional(),
  completed: z.boolean().optional(),
  title: TitleSchema.optional(),
});

export const TodoSchema = z.object({
  id: z.string(),
  description: DescriptionSchema.optional(),
  title: TitleSchema,
  completed: z.boolean(),
});

export type Todo = z.infer<typeof TodoSchema>;
export type TodoAdd = z.infer<typeof TodoAddSchema>;
export type TodoUpdate = z.infer<typeof TodoUpdateSchema>;
