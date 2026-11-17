import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jstack/ui/card";

import { getSession } from "~/auth/server";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Seeded users use the password <code>password</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </main>
  );
}
