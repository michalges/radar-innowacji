"use client";

import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GraphNode, IdeaGraph } from "@/lib/graph";

const LABEL_ZOOM = 1.7;
const GLASS = "glass";
const FLY_DURATION = 650;
const MIN_SCALE = 0.3;
const MAX_SCALE = 8;

const CLUSTER_COLORS = [
  { fill: "#CDE6EE", text: "#074A5C" },
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

type Size = { width: number; height: number };
type Insets = { left: number; top: number; right: number; bottom: number };

function getClusterColor(index: number) {
  return CLUSTER_COLORS[index % CLUSTER_COLORS.length];
}

function getEdges(nodes: GraphNode[], nodesById: Map<string, GraphNode>) {
  return nodes.flatMap((node) =>
    node.neighborIds.flatMap((neighborId) => {
      const neighbor = nodesById.get(neighborId);
      return neighbor && node.id < neighbor.id ? [{ source: node, target: neighbor }] : [];
    }),
  );
}

/** The side panel covers part of the canvas, so the graph is fitted into the area beside or below it. */
function getInsets(size: Size, panelRect: DOMRect | null): Insets {
  const isSidePanel = panelRect !== null && panelRect.right < size.width * 0.5;
  if (isSidePanel) {
    return { left: panelRect.right + 48, top: 72, right: 96, bottom: 96 };
  }
  return { left: 24, top: (panelRect?.bottom ?? 0) + 24, right: 72, bottom: 72 };
}

/** Cluster names sit above their dots so they never cover them. */
function getClusterLabelY(nodes: GraphNode[], clusterIndex: number, fallbackY: number): number {
  const clusterYs = nodes.filter((node) => node.clusterIndex === clusterIndex).map((node) => node.y);
  return clusterYs.length > 0 ? Math.min(...clusterYs) : fallbackY;
}

function getFitTransform(nodes: GraphNode[], size: Size, maxScale: number, panelRect: DOMRect | null): ZoomTransform {
  if (nodes.length === 0 || size.width === 0) {
    return zoomIdentity;
  }
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const boundsWidth = Math.max(60, Math.max(...xs) - minX);
  const boundsHeight = Math.max(60, Math.max(...ys) - minY);
  const insets = getInsets(size, panelRect);
  const freeWidth = Math.max(100, size.width - insets.left - insets.right);
  const freeHeight = Math.max(100, size.height - insets.top - insets.bottom);
  const scale = Math.min(maxScale, freeWidth / boundsWidth, freeHeight / boundsHeight);
  const centerX = insets.left + freeWidth / 2;
  const centerY = insets.top + freeHeight / 2;
  return zoomIdentity.translate(centerX - scale * (minX + boundsWidth / 2), centerY - scale * (minY + boundsHeight / 2)).scale(scale);
}

export function IdeaGraphView({ graph, header }: { graph: IdeaGraph; header: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeClusterIndex, setActiveClusterIndex] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .on("zoom", (event: { transform: ZoomTransform }) => setTransform(event.transform));
    zoomRef.current = behavior;
    select(svg).call(behavior).on("dblclick.zoom", null);
    return () => {
      select(svg).on(".zoom", null);
    };
  }, []);

  useEffect(() => {
    if (svgRef.current && zoomRef.current && size.width > 0) {
      select(svgRef.current).call(zoomRef.current.transform, getFitTransform(graph.nodes, size, 3, getPanelRect()));
    }
  }, [graph.nodes, size]);

  function getPanelRect(): DOMRect | null {
    const panel = panelRef.current;
    const container = containerRef.current;
    if (!panel || !container) {
      return null;
    }
    const panelBox = panel.getBoundingClientRect();
    const containerBox = container.getBoundingClientRect();
    return new DOMRect(panelBox.x - containerBox.x, panelBox.y - containerBox.y, panelBox.width, panelBox.height);
  }

  function animateTo(target: ZoomTransform) {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(FLY_DURATION).call(zoomRef.current.transform, target);
    }
  }

  function zoomBy(factor: number) {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor);
    }
  }

  function flyToNodes(nodes: GraphNode[]) {
    animateTo(getFitTransform(nodes, size, 4, getPanelRect()));
  }

  function resetView() {
    setSelectedId(null);
    setActiveClusterIndex(null);
    animateTo(getFitTransform(graph.nodes, size, 3, getPanelRect()));
  }

  function selectNode(node: GraphNode) {
    setSelectedId(node.id);
    setActiveClusterIndex(null);
    flyToNodes([node, ...node.neighborIds.flatMap((id) => nodesById.get(id) ?? [])]);
  }

  function selectCluster(clusterIndex: number) {
    if (activeClusterIndex === clusterIndex) {
      resetView();
      return;
    }
    setSelectedId(null);
    setActiveClusterIndex(clusterIndex);
    flyToNodes(graph.nodes.filter((node) => node.clusterIndex === clusterIndex));
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = getEdges(graph.nodes, nodesById);
  const focusNode = nodesById.get(hoveredId ?? selectedId ?? "");
  const selectedNode = nodesById.get(selectedId ?? "");
  const scale = transform.k;
  const isShowingAllLabels = scale >= LABEL_ZOOM;
  const visibleClusters = graph.clusters.filter((cluster) => cluster.size >= 2).toSorted((first, second) => second.size - first.size);

  function getIsHighlighted(node: GraphNode): boolean {
    if (focusNode) {
      return focusNode.id === node.id || focusNode.neighborIds.includes(node.id);
    }
    return activeClusterIndex === null || node.clusterIndex === activeClusterIndex;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        role="img"
        aria-label="Mapa pomysłów — podobne pomysły leżą blisko siebie"
        className="block size-full cursor-grab touch-none active:cursor-grabbing"
        onClick={() => {
          setSelectedId(null);
          setActiveClusterIndex(null);
        }}
      >
        <defs>
          <pattern id="map-grid" width={28} height={28} patternUnits="userSpaceOnUse" patternTransform={`translate(${transform.x} ${transform.y})`}>
            <circle cx={1} cy={1} r={1} fill="#D5DEDB" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />

        <g transform={transform.toString()}>
          {visibleClusters.map((cluster) => (
            <text
              key={cluster.index}
              x={cluster.x}
              y={getClusterLabelY(graph.nodes, cluster.index, cluster.y) - 16 / scale}
              textAnchor="middle"
              fontSize={14 / scale}
              letterSpacing={0.08 * (14 / scale)}
              fill={getClusterColor(cluster.index).text}
              paintOrder="stroke"
              stroke="#F7FAF9"
              strokeWidth={4 / scale}
              strokeLinejoin="round"
              opacity={focusNode || activeClusterIndex !== null || isShowingAllLabels ? 0 : 0.9}
              className="pointer-events-none font-display font-bold uppercase transition-opacity duration-300"
            >
              {cluster.label}
            </text>
          ))}

          {edges.map(({ source, target }) => {
            const isFocusedEdge = focusNode !== undefined && (focusNode.id === source.id || focusNode.id === target.id);
            const isSameCluster = source.clusterIndex === target.clusterIndex;
            const isInActiveCluster = activeClusterIndex !== null && isSameCluster && source.clusterIndex === activeClusterIndex;
            const isDimmed = (focusNode !== undefined && !isFocusedEdge) || (activeClusterIndex !== null && !isInActiveCluster);
            return (
              <line
                key={`${source.id}-${target.id}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isFocusedEdge ? "#1B1530" : isSameCluster ? getClusterColor(source.clusterIndex).text : "#94A3B8"}
                strokeOpacity={isFocusedEdge ? 0.6 : isDimmed ? 0.07 : 0.24}
                strokeWidth={(isFocusedEdge ? 2 : 1) / scale}
                className="transition-[stroke-opacity] duration-300"
              />
            );
          })}

          {graph.nodes.map((node) => {
            const isFocused = focusNode?.id === node.id;
            const isHighlighted = getIsHighlighted(node);
            return (
              <g
                key={node.id}
                opacity={isHighlighted ? 1 : 0.25}
                className="cursor-pointer transition-opacity duration-300"
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  selectNode(node);
                }}
              >
                <circle cx={node.x} cy={node.y} r={14 / scale} fill="transparent" />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={(isFocused ? 8 : 5.5) / Math.sqrt(scale)}
                  fill={getClusterColor(node.clusterIndex).text}
                  stroke="#fff"
                  strokeWidth={2 / scale}
                />
                {(isShowingAllLabels || isFocused || (activeClusterIndex !== null && isHighlighted)) && (
                  <text
                    x={node.x}
                    y={node.y - 12 / Math.sqrt(scale)}
                    textAnchor="middle"
                    fontSize={12 / scale}
                    fontWeight={isFocused ? 700 : 500}
                    fill="#1B1530"
                    paintOrder="stroke"
                    stroke="#F7FAF9"
                    strokeWidth={3 / scale}
                    className="pointer-events-none"
                  >
                    {node.title}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div
        ref={panelRef}
        className="pointer-events-none absolute inset-x-4 top-4 flex max-h-[calc(100%-32px)] flex-col gap-3 sm:inset-x-8 sm:top-6 lg:right-auto lg:w-80"
      >
        <div className={`pointer-events-auto rounded-3xl px-5 py-4 sm:self-start lg:self-stretch ${GLASS}`}>
          {header}
        </div>
        <ul className="-mx-4 -my-4 flex gap-2 overflow-x-auto px-4 py-4 pb-10 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:-mx-8 lg:min-h-0 lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:overflow-y-auto lg:pb-10">
          {visibleClusters.map((cluster) => {
            const isActive = activeClusterIndex === cluster.index;
            const color = getClusterColor(cluster.index);
            return (
              <li key={cluster.index} className="pointer-events-auto shrink-0">
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectCluster(cluster.index)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-full py-2 pr-3 pl-2.5 text-left text-sm font-semibold transition-colors hover:bg-white/80 ${GLASS}`}
                  style={isActive ? { backgroundColor: color.fill, color: color.text } : undefined}
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color.text }} />
                  <span className="flex-1 capitalize">{cluster.label.toLowerCase()}</span>
                  <span className="text-xs font-medium text-ink-soft">{cluster.size}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 sm:right-8 sm:bottom-6 lg:top-6 lg:bottom-auto">
        <button type="button" aria-label="Przybliż" onClick={() => zoomBy(1.6)} className={`size-11 cursor-pointer rounded-full text-xl font-semibold text-ink hover:bg-white/80 ${GLASS}`}>
          +
        </button>
        <button type="button" aria-label="Oddal" onClick={() => zoomBy(1 / 1.6)} className={`size-11 cursor-pointer rounded-full text-xl font-semibold text-ink hover:bg-white/80 ${GLASS}`}>
          −
        </button>
        <button type="button" aria-label="Pokaż wszystko" onClick={resetView} className={`size-11 cursor-pointer rounded-full text-sm font-semibold text-ink hover:bg-white/80 ${GLASS}`}>
          ⟲
        </button>
      </div>

      {selectedNode && (
        <div className={`absolute right-20 bottom-4 left-4 flex flex-col gap-2 rounded-3xl p-5 sm:left-8 sm:max-w-80 sm:bottom-6 lg:right-8 lg:left-auto ${GLASS}`}>
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
