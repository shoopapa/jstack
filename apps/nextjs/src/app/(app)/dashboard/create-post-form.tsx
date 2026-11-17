"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@jstack/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useForm,
} from "@jstack/ui/form";
import { Input } from "@jstack/ui/input";
import { Textarea } from "@jstack/ui/textarea";
import { toast } from "@jstack/ui/toast";
import { createPostSchema } from "@jstack/validators";

import { useTRPC } from "~/trpc/react";

export function CreatePostForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm({
    schema: createPostSchema,
    defaultValues: { title: "", body: "" },
  });

  const create = useMutation(
    trpc.post.create.mutationOptions({
      onSuccess: async () => {
        form.reset();
        await queryClient.invalidateQueries(trpc.post.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="Write something…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="self-end" disabled={create.isPending}>
          Post
        </Button>
      </form>
    </Form>
  );
}
