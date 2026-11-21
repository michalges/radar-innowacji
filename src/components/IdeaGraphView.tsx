"use client";

import { Delaunay } from "d3-delaunay";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GRAPH_HEIGHT, GRAPH_WIDTH, type GraphNode, type IdeaGraph } from "@/lib/graph";

const TERRITORY_RADIUS = 46;
const LABEL_ZOOM = 1.7;

const CLUSTER_COLORS = [
  { fill: "#CCEFE4", text: "#0B5D57" },
  { fill: "#E4F5C4", text: "#3F6212" },
  { fill: "#FCE7B2", text: "#7A4A00" },
  { fill: "#D6E6FB", text: "#1D4F91" },
  { fill: "#F4D9EC", text: "#8A2463" },
  { fill: "#E5DDFB", text: "#4C2FA8" },
  { fill: "#FBDCCF", text: "#8A3412" },
  { fill: "#D3F1F6", text: "#155E75" },
  { fill: "#EDE7DA", text: "#5B4B2A" },
  { fill: "#E2E8F0", text: "#334155" },
];

function getClusterColor(index: number) {
  return CLUSTER_COLORS[index % CLUSTER_COLORS.length];
}

function getCellPaths(nodes: GraphNode[]): string[] {
  if (nodes.length < 2) {
    return nodes.map(() => "");
  }
  const voronoi = Delaunay.from(nodes, (node) => node.x, (node) => node.y).voronoi([-200, -200, GRAPH_WIDTH + 200, GRAPH_HEIGHT + 200]);
  return nodes.map((_, index) => voronoi.renderCell(index));
}

export function IdeaGraphView({ graph }: { graph: IdeaGraph }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 6])
      .translateExtent([
        [-200, -200],
        [GRAPH_WIDTH + 200, GRAPH_HEIGHT + 200],
      ])
      .on("zoom", (event: { transform: ZoomTransform }) => setTransform(event.transform));
    zoomRef.current = behavior;
    select(svg).call(behavior);
    return () => {
      select(svg).on(".zoom", null);
    };
  }, []);

  function zoomBy(factor: number) {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).call(zoomRef.current.scaleBy, factor);
    }
  }

  function resetZoom() {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);
    }
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const cellPaths = getCellPaths(graph.nodes);
  const focusNode = nodesById.get(hoveredId ?? selectedId ?? "");
  const selectedNode = nodesById.get(selectedId ?? "");
  const scale = transform.k;
  const isShowingAllLabels = scale >= LABEL_ZOOM;

  function getIsHighlighted(node: GraphNode): boolean {
    return !focusNode || focusNode.id === node.id || focusNode.neighborIds.includes(node.id);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] bg-[#F7FAF9]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        role="img"
        aria-label="Mapa pomysłów — podobne pomysły tworzą wspólne obszary"
        className="block h-[min(72vh,720px)] w-full cursor-grab touch-none active:cursor-grabbing"
        onClick={() => setSelectedId(null)}
      >
        <defs>
          <clipPath id="territories">
            {graph.nodes.map((node) => (
              <circle key={node.id} cx={node.x} cy={node.y} r={TERRITORY_RADIUS} />
            ))}
          </clipPath>
        </defs>
        <g transform={transform.toString()}>
          <g clipPath="url(#territories)">
            {graph.nodes.map((node, index) => (
              <path
                key={node.id}
                d={cellPaths[index]}
                fill={getClusterColor(node.clusterIndex).fill}
                stroke={getClusterColor(node.clusterIndex).fill}
                strokeWidth={1}
              />
            ))}
          </g>

          {focusNode &&
            focusNode.neighborIds.map((neighborId) => {
              const neighbor = nodesById.get(neighborId);
              return (
                neighbor && (
                  <line
                    key={neighborId}
                    x1={focusNode.x}
                    y1={focusNode.y}
                    x2={neighbor.x}
                    y2={neighbor.y}
                    stroke="#1B1530"
                    strokeOpacity={0.35}
                    strokeWidth={1.5 / scale}
                  />
                )
              );
            })}

          {graph.nodes.map((node) => {
            const isFocused = focusNode?.id === node.id;
            return (
              <g
                key={node.id}
                opacity={getIsHighlighted(node) ? 1 : 0.3}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(node.id);
                }}
              >
                <circle cx={node.x} cy={node.y} r={14 / Math.sqrt(scale)} fill="transparent" />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={(isFocused ? 7 : 4.5) / Math.sqrt(scale)}
                  fill={node.isTech ? "#0F766E" : "#65A30D"}
                  stroke="#fff"
                  strokeWidth={1.5 / scale}
                />
                {(isShowingAllLabels || isFocused) && (
                  <text
                    x={node.x}
                    y={node.y - 10 / scale}
                    textAnchor="middle"
                    fontSize={12 / scale}
                    fontWeight={isFocused ? 700 : 500}
                    fill="#1B1530"
                    paintOrder="stroke"
                    stroke="#fff"
                    strokeWidth={3 / scale}
                    className="pointer-events-none"
                  >
                    {node.title}
                  </text>
                )}
              </g>
            );
          })}

          {graph.clusters
            .filter((cluster) => cluster.size >= 2)
            .map((cluster) => (
              <text
                key={cluster.index}
                x={cluster.x}
                y={cluster.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(30, 14 + cluster.size * 1.6) / Math.sqrt(scale)}
                fill={getClusterColor(cluster.index).text}
                opacity={isShowingAllLabels ? 0.35 : 0.95}
                paintOrder="stroke"
                stroke={getClusterColor(cluster.index).fill}
                strokeWidth={5 / scale}
                className="pointer-events-none font-display font-extrabold tracking-tight uppercase"
              >
                {cluster.label}
              </text>
            ))}
        </g>
      </svg>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <button type="button" aria-label="Przybliż" onClick={() => zoomBy(1.5)} className="size-11 cursor-pointer rounded-full bg-white text-xl font-semibold text-ink shadow-sm hover:bg-paper">
          +
        </button>
        <button type="button" aria-label="Oddal" onClick={() => zoomBy(1 / 1.5)} className="size-11 cursor-pointer rounded-full bg-white text-xl font-semibold text-ink shadow-sm hover:bg-paper">
          −
        </button>
        <button type="button" aria-label="Resetuj widok" onClick={resetZoom} className="size-11 cursor-pointer rounded-full bg-white text-sm font-semibold text-ink shadow-sm hover:bg-paper">
          ⟲
        </button>
      </div>

      {selectedNode && (
        <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-24px)] flex-col gap-2 rounded-2xl bg-white p-4 shadow-md sm:max-w-80">
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: getClusterColor(selectedNode.clusterIndex).text }}>
            {graph.clusters[selectedNode.clusterIndex]?.label}
          </span>
          <b className="font-display text-lg leading-snug">{selectedNode.title}</b>
          <span className="text-sm text-ink-soft">{selectedNode.neighborIds.length} podobnych</span>
          <Link href={`/pomysl/${selectedNode.id}`} className="self-start rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-teal-dark">
            Szczegóły →
          </Link>
        </div>
      )}
    </div>
  );
}
