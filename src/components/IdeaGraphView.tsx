"use client";

import { useState } from "react";
import { GRAPH_HEIGHT, GRAPH_WIDTH, type IdeaGraph } from "@/lib/graph";

const LABEL_MAX_LENGTH = 28;

function getShortTitle(title: string): string {
  return title.length > LABEL_MAX_LENGTH ? `${title.slice(0, LABEL_MAX_LENGTH - 1)}…` : title;
}

export function IdeaGraphView({ graph }: { graph: IdeaGraph }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const activeNode = activeId ? nodesById.get(activeId) : undefined;

  function getIsDimmed(id: string): boolean {
    return Boolean(activeNode && activeNode.id !== id && !activeNode.neighborIds.includes(id));
  }

  return (
    <svg
      viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
      role="img"
      aria-label="Mapa pomysłów — podobne pomysły leżą blisko siebie"
      className="w-full"
    >
      {graph.clusters.map((cluster) => (
        <text
          key={`${cluster.label}-${cluster.x}`}
          x={cluster.x}
          y={cluster.y}
          textAnchor="middle"
          className="fill-teal-dark font-display text-[15px] font-semibold"
          opacity={activeNode ? 0.35 : 1}
        >
          #{cluster.label}
        </text>
      ))}
      {graph.edges.map((edge) => {
        const source = nodesById.get(edge.sourceId);
        const target = nodesById.get(edge.targetId);
        if (!source || !target) {
          return null;
        }
        const isActive = activeId === edge.sourceId || activeId === edge.targetId;
        return (
          <line
            key={`${edge.sourceId}-${edge.targetId}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={isActive ? "#0F766E" : "#1B1530"}
            strokeOpacity={isActive ? 0.6 : activeNode ? 0.04 : Math.min(0.25, edge.similarity)}
            strokeWidth={1 + edge.similarity * 4}
          />
        );
      })}
      {graph.nodes.map((node) => {
        const isDimmed = getIsDimmed(node.id);
        const isActive = node.id === activeId;
        return (
          <a
            key={node.id}
            href={`/pomysl/${node.id}`}
            onMouseEnter={() => setActiveId(node.id)}
            onMouseLeave={() => setActiveId(null)}
            onFocus={() => setActiveId(node.id)}
            onBlur={() => setActiveId(null)}
            className="outline-none"
          >
            <g opacity={isDimmed ? 0.25 : 1}>
            <circle cx={node.x} cy={node.y} r={isActive ? 13 : 10} fill={node.isTech ? "#0F766E" : "#A3E635"} stroke="#fff" strokeWidth={2} />
            <text
              x={node.x}
              y={node.y + 26}
              textAnchor="middle"
              className={`text-[12px] ${isActive ? "fill-ink font-semibold" : "fill-ink-soft"}`}
              paintOrder="stroke"
              stroke="#fff"
              strokeWidth={4}
            >
              {isActive ? node.title : getShortTitle(node.title)}
            </text>
            </g>
          </a>
        );
      })}
    </svg>
  );
}
