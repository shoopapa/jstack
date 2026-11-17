import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { CreatePostForm } from "./create-post-form";
import { OrgHeading } from "./org-heading";
import { PostList } from "./post-list";

export default async function DashboardPage() {
  // Layouts and pages render in parallel, so the (app) layout's redirect does
  // not stop this page's prefetches — guard here too (getSession is cached).
  if (!(await getSession())) redirect("/sign-in");

  // Start the queries on the server; client components pick them up hydrated.
  prefetch(trpc.organization.current.queryOptions());
  prefetch(trpc.post.list.queryOptions());

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <OrgHeading />
        <CreatePostForm />
        <PostList />
      </div>
    </HydrateClient>
  );
}
