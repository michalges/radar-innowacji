"use client";

import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { searchMap, type MapSearch } from "@/app/actions";
import { MapSearchForm, MapSearchIntro, MapSearchResults, MapSearchSkeleton, MapSearchSuggestions } from "@/components/MapSearchPanel";
import type { GraphNode, IdeaGraph } from "@/lib/graph";
import { DEFAULT_MIN_RELEVANCE, getMapPin, getPlacedHits, type MapPin } from "@/lib/mapSearch";

const LABEL_ZOOM = 1.7;
const GLASS = "glass";
const FLY_DURATION = 650;
const MIN_SCALE = 0.3;
const MAX_SCALE = 8;

const CLUSTER_COLORS = [
  { text: "#074A5C" },
  { text: "#3F6212" },
  { text: "#7A4A00" },
  { text: "#1D4F91" },
  { text: "#8A2463" },
  { text: "#4C2FA8" },
  { text: "#8A3412" },
  { text: "#155E75" },
  { text: "#5B4B2A" },
  { text: "#334155" },
];

const PIN_PATH = "M32 54 C22 42 16 34 16 25 A16 16 0 0 1 48 25 C48 34 42 42 32 54 Z";

type Size = { width: number; height: number };
type Point = { x: number; y: number };
type Insets = { left: number; top: number; right: number; bottom: number };
type PendingFit = { points: Point[]; maxScale: number };

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

/** The search panel covers part of the canvas, so the graph is fitted into the area beside or below it. */
function getInsets(size: Size, panelRect: DOMRect | null): Insets {
  const isSidePanel = panelRect !== null && panelRect.right < size.width * 0.5;
  if (isSidePanel) {
    return { left: panelRect.right + 48, top: 72, right: 96, bottom: 96 };
  }
  return { left: 24, top: (panelRect?.bottom ?? 0) + 24, right: 72, bottom: 48 };
}

/** Cluster names sit above their dots so they never cover them. */
function getClusterLabelY(nodes: GraphNode[], clusterIndex: number, fallbackY: number): number {
  const clusterYs = nodes.filter((node) => node.clusterIndex === clusterIndex).map((node) => node.y);
  return clusterYs.length > 0 ? Math.min(...clusterYs) : fallbackY;
}

function getSearchUrl(query: string): string {
  return query ? `/?q=${encodeURIComponent(query)}` : "/";
}

/** The query as a radar ping: a dropped pin with rings, drawn at screen size whatever the zoom. */
function SearchPinMarker({ pin, scale }: { pin: MapPin; scale: number }) {
  return (
    <g transform={`translate(${pin.x} ${pin.y}) scale(${1 / scale})`} className="pointer-events-none">
      {[0, 0.8, 1.6].map((delay) => (
        <circle key={delay} r={34} fill="none" stroke="var(--color-primary)" strokeWidth={2} className="radar-ping" style={{ animationDelay: `${delay}s` }} />
      ))}
      <g className="pin-drop">
        <ellipse cx={0} cy={1} rx={9} ry={2.5} fill="rgb(27 21 48 / 0.18)" />
        <path d={PIN_PATH} transform="translate(-22.4 -37.8) scale(0.7)" fill="var(--color-primary)" stroke="#fff" strokeWidth={2.5} />
        <circle cx={0} cy={-20.3} r={4.2} fill="#fff" />
      </g>
      {pin.isGap && (
        <text y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--color-warn)" paintOrder="stroke" stroke="#F7FAF9" strokeWidth={4} className="uppercase">
          Nieodkryty obszar
        </text>
      )}
    </g>
  );
}

function getFitTransform(nodes: Point[], size: Size, maxScale: number, panelRect: DOMRect | null): ZoomTransform {
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

export function IdeaGraphView({ graph, suggestions, initialQuery }: { graph: IdeaGraph; suggestions: string[]; initialQuery: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState<MapSearch | null>(null);
  const [minRelevance, setMinRelevance] = useState(DEFAULT_MIN_RELEVANCE);
  const [isSearching, startSearch] = useTransition();
  const hasRunInitialSearchRef = useRef(false);
  const pendingFitRef = useRef<PendingFit | null>(null);

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

  /** Fits run after commit, because docking or undocking the search panel changes the free area of the map. */
  useEffect(() => {
    const pendingFit = pendingFitRef.current;
    if (pendingFit) {
      pendingFitRef.current = null;
      animateTo(getFitTransform(pendingFit.points, size, pendingFit.maxScale, getPanelRect()));
    }
  });

  useEffect(() => {
    if (initialQuery && size.width > 0 && !hasRunInitialSearchRef.current) {
      hasRunInitialSearchRef.current = true;
      runSearch(initialQuery);
    }
  });

  function runSearch(nextQuery: string) {
    setQuery(nextQuery);
    startSearch(async () => {
      const result = await searchMap(nextQuery);
      window.history.replaceState(null, "", getSearchUrl(result?.query ?? ""));
      setSearch(result);
      setMinRelevance(DEFAULT_MIN_RELEVANCE);
      setSelectedId(null);
      if (result) {
        const resultHits = getPlacedHits(result.hits, nodesById);
        const resultVisibleHits = resultHits.filter((hit) => hit.relevance >= DEFAULT_MIN_RELEVANCE);
        const resultPin = getMapPin(resultHits, resultVisibleHits, graph.nodes);
        pendingFitRef.current = { points: [resultPin, ...resultVisibleHits.map((hit) => hit.node)], maxScale: 3.5 };
      }
    });
  }

  function clearSearch() {
    setSearch(null);
    setQuery("");
    setSelectedId(null);
    window.history.replaceState(null, "", getSearchUrl(""));
    pendingFitRef.current = { points: graph.nodes, maxScale: 3 };
  }

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

  function flyToNodes(nodes: Point[]) {
    animateTo(getFitTransform(nodes, size, 4, getPanelRect()));
  }

  function resetView() {
    setSelectedId(null);
    animateTo(getFitTransform(graph.nodes, size, 3, getPanelRect()));
  }

  function selectNode(node: GraphNode) {
    setSelectedId(node.id);
    flyToNodes([node, ...node.neighborIds.flatMap((id) => nodesById.get(id) ?? [])]);
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = getEdges(graph.nodes, nodesById);
  const focusNode = nodesById.get(hoveredId ?? selectedId ?? "");
  const selectedNode = nodesById.get(selectedId ?? "");
  const scale = transform.k;
  const isShowingAllLabels = scale >= LABEL_ZOOM;
  const visibleClusters = graph.clusters.filter((cluster) => cluster.size >= 2).toSorted((first, second) => second.size - first.size);
  const placedHits = search ? getPlacedHits(search.hits, nodesById) : [];
  const visibleHits = placedHits.filter((hit) => hit.relevance >= minRelevance);
  const visibleHitsById = new Map(visibleHits.map((hit) => [hit.id, hit]));
  const pin = search ? getMapPin(placedHits, visibleHits, graph.nodes) : null;
  const isSearchActive = search !== null;
  const isDocked = isSearchActive || isSearching;

  function getIsHighlighted(node: GraphNode): boolean {
    if (focusNode) {
      return focusNode.id === node.id || focusNode.neighborIds.includes(node.id);
    }
    if (isSearchActive) {
      return visibleHitsById.has(node.id);
    }
    return true;
  }

  function getNodeOpacity(node: GraphNode, isHighlighted: boolean): number {
    const hit = visibleHitsById.get(node.id);
    if (isSearchActive && hit && !focusNode) {
      return 0.45 + 0.55 * hit.relevance;
    }
    return isHighlighted ? 1 : isSearchActive ? 0.18 : 0.25;
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
        onClick={() => setSelectedId(null)}
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
              opacity={focusNode || isSearchActive || isShowingAllLabels ? 0 : 0.9}
              className="pointer-events-none font-display font-bold uppercase transition-opacity duration-300"
            >
              {cluster.label}
            </text>
          ))}

          {edges.map(({ source, target }) => {
            const isFocusedEdge = focusNode !== undefined && (focusNode.id === source.id || focusNode.id === target.id);
            const isSameCluster = source.clusterIndex === target.clusterIndex;
            const isDimmed = (focusNode !== undefined || isSearchActive) && !isFocusedEdge;
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

          {pin && (
            <g className="pointer-events-none">
              <circle
                cx={pin.x}
                cy={pin.y}
                r={pin.radius}
                fill={pin.isGap ? "rgb(146 64 14 / 0.05)" : "rgb(30 64 175 / 0.06)"}
                stroke={pin.isGap ? "var(--color-warn)" : "var(--color-primary)"}
                strokeOpacity={0.5}
                strokeWidth={1.5 / scale}
                strokeDasharray={`${6 / scale} ${5 / scale}`}
                className="transition-[r] duration-300"
              />
              {visibleHits.map((hit) => (
                <line
                  key={hit.id}
                  x1={pin.x}
                  y1={pin.y}
                  x2={hit.node.x}
                  y2={hit.node.y}
                  stroke="var(--color-primary)"
                  strokeOpacity={0.2 + 0.5 * hit.relevance}
                  strokeWidth={(hoveredId === hit.id ? 2.5 : 1.5) / scale}
                />
              ))}
            </g>
          )}

          {graph.nodes.map((node) => {
            const isFocused = focusNode?.id === node.id;
            const isHighlighted = getIsHighlighted(node);
            const isSearchHit = visibleHitsById.has(node.id);
            return (
              <g
                key={node.id}
                opacity={getNodeOpacity(node, isHighlighted)}
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
                {(isFocused || isSearchHit || (!isSearchActive && isShowingAllLabels)) && (
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

          {pin && <SearchPinMarker key={search?.query} pin={pin} scale={scale} />}
        </g>
      </svg>

      {!isDocked && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgb(244_248_246/0.96)_35%,transparent)]"
        />
      )}

      <div
        ref={panelRef}
        className={`pointer-events-none absolute flex flex-col ${
          isDocked
            ? "inset-x-4 top-4 max-h-[calc(100%-32px)] gap-3 sm:inset-x-8 sm:top-6 lg:right-auto lg:w-88"
            : "inset-x-4 top-8 mx-auto max-w-xl items-center gap-4 sm:top-12 sm:gap-5"
        }`}
      >
        {!isDocked && <MapSearchIntro />}
        <MapSearchForm query={query} isHero={!isDocked} isSearching={isSearching} onQueryChange={setQuery} onSearch={runSearch} />
        {!isDocked && <MapSearchSuggestions suggestions={suggestions} onPick={runSearch} />}
        {isSearching && <MapSearchSkeleton />}
        {!isSearching && search && pin && (
          <MapSearchResults
            search={search}
            visibleHits={visibleHits}
            hiddenCount={placedHits.length - visibleHits.length}
            minRelevance={minRelevance}
            isGap={pin.isGap}
            selectedId={selectedId}
            getColor={(clusterIndex) => getClusterColor(clusterIndex).text}
            onMinRelevanceChange={setMinRelevance}
            onHover={setHoveredId}
            onSelect={(hit) => selectNode(hit.node)}
            onClear={clearSearch}
          />
        )}
      </div>

      <div className="absolute top-1/2 right-8 hidden -translate-y-1/2 flex-col gap-1 sm:flex">
        <button type="button" aria-label="Przybliż" onClick={() => zoomBy(1.6)} className={`size-9 cursor-pointer rounded-full text-lg font-semibold text-ink hover:bg-white/80 ${GLASS}`}>
          +
        </button>
        <button type="button" aria-label="Oddal" onClick={() => zoomBy(1 / 1.6)} className={`size-9 cursor-pointer rounded-full text-lg font-semibold text-ink hover:bg-white/80 ${GLASS}`}>
          −
        </button>
        <button type="button" aria-label="Pokaż wszystko" onClick={resetView} className={`size-9 cursor-pointer rounded-full text-sm font-semibold text-ink hover:bg-white/80 ${GLASS}`}>
          ⟲
        </button>
      </div>

      {selectedNode && (
        <div
          className={`absolute inset-x-4 flex flex-col gap-1.5 rounded-2xl p-4 sm:right-8 sm:left-auto sm:w-80 bottom-4 sm:bottom-6 ${GLASS}`}
        >
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: getClusterColor(selectedNode.clusterIndex).text }}>
            {graph.clusters[selectedNode.clusterIndex]?.label}
          </span>
          <b className="font-display text-base leading-snug">{selectedNode.title}</b>
          <span className="text-sm text-ink-soft">{selectedNode.neighborIds.length} podobnych</span>
          <Link href={`/pomysl/${selectedNode.id}`} className="self-start rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-white no-underline hover:bg-primary-dark">
            Szczegóły →
          </Link>
        </div>
      )}
    </div>
  );
}
