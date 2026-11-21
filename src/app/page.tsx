import { Suspense } from "react";
import { IdeaGraphView } from "@/components/IdeaGraphView";
import { getIdeaGraph } from "@/lib/graph";
import { getCards, getChallenges } from "@/lib/repository";

const SUGGESTION_COUNT = 4;

function getQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

async function GraphContent({ searchParams }: PageProps<"/">) {
  const [graph, challenges, { q }] = await Promise.all([getCards().then(getIdeaGraph), getChallenges(), searchParams]);
  const suggestions = challenges.slice(0, SUGGESTION_COUNT).map((challenge) => challenge.title);
  return <IdeaGraphView graph={graph} suggestions={suggestions} initialQuery={getQuery(q)} />;
}

export default function HomePage(props: PageProps<"/">) {
  return (
    <main className="relative flex-1 bg-[#F4F8F6] bg-[radial-gradient(40rem_30rem_at_8%_20%,rgb(30_64_175/0.16),transparent),radial-gradient(36rem_28rem_at_95%_90%,rgb(101_163_13/0.16),transparent),radial-gradient(30rem_24rem_at_60%_0%,rgb(76_47_168/0.08),transparent)]">
      <Suspense fallback={<p className="p-6 text-ink-soft">Ładuję…</p>}>
        <GraphContent {...props} />
      </Suspense>
    </main>
  );
}
