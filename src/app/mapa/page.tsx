import type { Metadata } from "next";
import { Suspense } from "react";
import { IdeaGraphView } from "@/components/IdeaGraphView";
import { TypeLegend } from "@/components/TypeLegend";
import { getIdeaGraph } from "@/lib/graph";
import { getCards } from "@/lib/repository";

export const metadata: Metadata = { title: "Mapa pomysłów · Radar Innowacji" };

async function GraphContent() {
  const graph = getIdeaGraph(await getCards());
  return <IdeaGraphView graph={graph} />;
}

export default function MapPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[clamp(34px,4.5vw,54px)] leading-none font-extrabold tracking-tight">
          Mapa <span className="text-teal">pomysłów</span>
        </h1>
        <p className="text-[17px] text-ink-soft">Podobne pomysły leżą blisko siebie.</p>
      </div>
      <section aria-label="Mapa" className="flex flex-col items-center gap-3 rounded-[32px] border border-line p-4 sm:p-6">
        <Suspense fallback={<p className="text-ink-soft">Ładuję…</p>}>
          <GraphContent />
        </Suspense>
        <TypeLegend />
      </section>
    </>
  );
}
