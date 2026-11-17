import { z } from "zod";

/**
 * Schemas shared by the API (input validation) and the UI (form validation),
 * so a field's rules live in exactly one place.
 */
export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(10_000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "At least 8 characters"),
});
