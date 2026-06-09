import Link from "next/link";

import { CreatureForm } from "@/components/creature/creature-form";

export default function NewCreaturePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-8">
        <Link href="/library" className="font-mono text-sm text-primary hover:text-accent">
          Back to library
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          New Creature
        </h1>
        <div className="mt-8">
          <CreatureForm mode="create" />
        </div>
      </section>
    </main>
  );
}
