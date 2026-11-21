import { Suspense } from "react";
import { IdeaGraphView } from "@/components/IdeaGraphView";
import { getIdeaGraph } from "@/lib/graph";
import { getCards } from "@/lib/repository";

const MAP_HEADER = (
  <h1 className="font-display text-[32px] leading-none whitespace-nowrap font-extrabold tracking-tight">
    Mapa <span className="text-teal">pomysłów</span>
  </h1>
);

async function GraphContent() {
  const graph = getIdeaGraph(await getCards());
  return <IdeaGraphView graph={graph} header={MAP_HEADER} />;
}

export default function HomePage() {
  return (
    <main className="relative flex-1 bg-[#F4F8F6] bg-[radial-gradient(40rem_30rem_at_8%_20%,rgb(10_97_120/0.16),transparent),radial-gradient(36rem_28rem_at_95%_90%,rgb(101_163_13/0.16),transparent),radial-gradient(30rem_24rem_at_60%_0%,rgb(76_47_168/0.08),transparent)]">
      <Suspense fallback={<p className="p-6 text-ink-soft">Ładuję…</p>}>
        <GraphContent />
      </Suspense>
    </main>
  );
}
