import { Suspense } from "react";
import { IdeaGraphView } from "@/components/IdeaGraphView";
import { getIdeaGraph } from "@/lib/graph";
import { getCards } from "@/lib/repository";

const MAP_HEADER = (
  <h1 className="font-display text-[26px] leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-[32px]">
    Mapa <span className="text-teal">pomysłów</span>
  </h1>
);

function getQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

async function GraphContent({ searchParams }: PageProps<"/">) {
  const [graph, { q }] = await Promise.all([getCards().then(getIdeaGraph), searchParams]);
  return <IdeaGraphView graph={graph} header={MAP_HEADER} initialQuery={getQuery(q)} />;
}

export default function HomePage(props: PageProps<"/">) {
  return (
    <main className="relative flex-1 bg-[#F4F8F6] bg-[radial-gradient(40rem_30rem_at_8%_20%,rgb(10_97_120/0.16),transparent),radial-gradient(36rem_28rem_at_95%_90%,rgb(101_163_13/0.16),transparent),radial-gradient(30rem_24rem_at_60%_0%,rgb(76_47_168/0.08),transparent)]">
      <Suspense fallback={<p className="p-6 text-ink-soft">Ładuję…</p>}>
        <GraphContent {...props} />
      </Suspense>
    </main>
  );
}
