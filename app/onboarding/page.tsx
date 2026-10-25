import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { StackPicker } from "@/components/onboarding/stack-picker";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Pick your stack</h1>
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
          We’ll use it to show skills that fit how you build.
        </p>
      </div>
      <StackPicker />
    </div>
  );
}
