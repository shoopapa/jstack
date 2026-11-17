"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function OrgHeading() {
  const trpc = useTRPC();
  const { data, error } = useQuery(trpc.organization.current.queryOptions());

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        You are not in an organization yet.
      </p>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold">{data?.name ?? "…"}</h1>
      <p className="text-sm text-muted-foreground">Role: {data?.role}</p>
    </div>
  );
}
