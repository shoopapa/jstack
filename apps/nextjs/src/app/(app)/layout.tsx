import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { SignOutButton } from "./sign-out-button";

/** Everything under (app) requires a session — gate on the server. */
export default async function AppLayout(props: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">jstack</span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {session.user.email}
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 p-6">
        {props.children}
      </main>
    </div>
  );
}
