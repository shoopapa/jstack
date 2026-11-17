"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@jstack/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@jstack/ui/card";
import { toast } from "@jstack/ui/toast";

import { useTRPC } from "~/trpc/react";

export function PostList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: posts = [], isPending } = useQuery(
    trpc.post.list.queryOptions(),
  );

  const remove = useMutation(
    trpc.post.delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.post.pathFilter()),
      onError: (err) => toast.error(err.message),
    }),
  );

  if (isPending) return <p className="text-muted-foreground">Loading…</p>;
  if (posts.length === 0) {
    return <p className="text-muted-foreground">No posts yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{post.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {post.authorName ?? "Unknown"} ·{" "}
                  {post.createdAt.toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate({ id: post.id })}
              >
                Delete
              </Button>
            </CardHeader>
            {post.body && (
              <CardContent className="whitespace-pre-wrap text-sm">
                {post.body}
              </CardContent>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
