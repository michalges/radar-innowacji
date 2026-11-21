import type { MapSearchHit } from "@/app/actions";
import type { GraphNode } from "@/lib/graph";

export const DEFAULT_MIN_RELEVANCE = 0.5;
/** Below this, even the best match only loosely fits: the query lands in a gap nobody has solved yet. */
const GAP_RELEVANCE = 0.45;
const CIRCLE_PADDING = 28;
const MIN_CIRCLE_RADIUS = 48;

export type PlacedHit = MapSearchHit & { node: GraphNode };
export type MapPin = { x: number; y: number; radius: number; isGap: boolean };

export function getPlacedHits(hits: MapSearchHit[], nodesById: Map<string, GraphNode>): PlacedHit[] {
  return hits.flatMap((hit) => {
    const node = nodesById.get(hit.id);
    return node ? [{ ...hit, node }] : [];
  });
}

function getCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / Math.max(1, points.length), y: total.y / Math.max(1, points.length) };
}

/** Strong matches pull harder (relevance squared), so the pin lands nearest the ideas that solve the problem best. */
function getWeightedCentroid(hits: PlacedHit[]): { x: number; y: number } {
  const totalWeight = hits.reduce((sum, hit) => sum + hit.relevance ** 2, 0) || 1;
  return hits.reduce(
    (point, hit) => ({
      x: point.x + (hit.node.x * hit.relevance ** 2) / totalWeight,
      y: point.y + (hit.node.y * hit.relevance ** 2) / totalWeight,
    }),
    { x: 0, y: 0 },
  );
}

/** Places the query on the map: inside its matches, or in the middle of the map when nothing matches at all. */
export function getMapPin(placedHits: PlacedHit[], visibleHits: PlacedHit[], allNodes: GraphNode[]): MapPin {
  const anchorHits = visibleHits.length > 0 ? visibleHits : placedHits;
  const center = anchorHits.length > 0 ? getWeightedCentroid(anchorHits) : getCentroid(allNodes);
  const farthestDistance = Math.max(0, ...visibleHits.map((hit) => Math.hypot(hit.node.x - center.x, hit.node.y - center.y)));
  return {
    ...center,
    radius: Math.max(MIN_CIRCLE_RADIUS, farthestDistance + CIRCLE_PADDING),
    isGap: (placedHits[0]?.relevance ?? 0) < GAP_RELEVANCE,
  };
}
