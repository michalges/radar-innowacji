import { getSimilarityMatrix } from "@/lib/similarity";
import type { Card } from "@/lib/types";

export const GRAPH_WIDTH = 1000;
export const GRAPH_HEIGHT = 640;
const PADDING = 70;
const EDGE_SIMILARITY = 0.07;
const CLUSTER_SIMILARITY = 0.1;
const ITERATIONS = 500;

export type GraphNode = { id: string; title: string; isTech: boolean; x: number; y: number; neighborIds: string[] };
export type GraphEdge = { sourceId: string; targetId: string; similarity: number };
export type GraphCluster = { label: string; x: number; y: number };
export type IdeaGraph = { nodes: GraphNode[]; edges: GraphEdge[]; clusters: GraphCluster[] };

type Point = { x: number; y: number };

/** Deterministic force layout: similar ideas attract, all ideas repel, so groups emerge from text similarity. */
function getForceLayout(matrix: number[][]): Point[] {
  const count = matrix.length;
  const points = matrix.map((_, index) => ({
    x: Math.cos((index / count) * 2 * Math.PI) * 200,
    y: Math.sin((index / count) * 2 * Math.PI) * 200,
  }));
  for (let step = 0; step < ITERATIONS; step++) {
    const cooling = 1 - step / ITERATIONS;
    const forces = points.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const repulsion = 9000 / (distance * distance);
        const similarity = matrix[i][j];
        const attraction = similarity >= EDGE_SIMILARITY ? similarity * (distance - 40) * 0.08 : 0;
        const force = attraction - repulsion;
        forces[i].x += (dx / distance) * force;
        forces[i].y += (dy / distance) * force;
        forces[j].x -= (dx / distance) * force;
        forces[j].y -= (dy / distance) * force;
      }
    }
    for (let i = 0; i < count; i++) {
      forces[i].x -= points[i].x * 0.01;
      forces[i].y -= points[i].y * 0.01;
      const magnitude = Math.hypot(forces[i].x, forces[i].y);
      const limit = 12 * cooling + 0.5;
      const scale = magnitude > limit ? limit / magnitude : 1;
      points[i].x += forces[i].x * scale;
      points[i].y += forces[i].y * scale;
    }
  }
  return points;
}

function getFittedPoints(points: Point[]): Point[] {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((GRAPH_WIDTH - PADDING * 2) / (maxX - minX || 1), (GRAPH_HEIGHT - PADDING * 2) / (maxY - minY || 1));
  const offsetX = (GRAPH_WIDTH - (maxX - minX) * scale) / 2;
  const offsetY = (GRAPH_HEIGHT - (maxY - minY) * scale) / 2;
  return points.map((point) => ({ x: offsetX + (point.x - minX) * scale, y: offsetY + (point.y - minY) * scale }));
}

function getClusterGroups(matrix: number[][]): number[][] {
  const visited = new Set<number>();
  const groups: number[][] = [];
  for (let start = 0; start < matrix.length; start++) {
    if (visited.has(start)) {
      continue;
    }
    const group: number[] = [];
    const queue = [start];
    visited.add(start);
    while (queue.length > 0) {
      const current = queue.shift() ?? start;
      group.push(current);
      matrix[current].forEach((similarity, other) => {
        if (!visited.has(other) && similarity >= CLUSTER_SIMILARITY) {
          visited.add(other);
          queue.push(other);
        }
      });
    }
    groups.push(group);
  }
  return groups;
}

function getMostCommonTag(cards: Card[]): string | null {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const tag of card.tags) {
      const normalized = tag.toLowerCase();
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  const [best] = [...counts.entries()].sort((first, second) => second[1] - first[1]);
  return best && best[1] >= 2 ? best[0] : null;
}

export function getIdeaGraph(cards: Card[]): IdeaGraph {
  if (cards.length === 0) {
    return { nodes: [], edges: [], clusters: [] };
  }
  const matrix = getSimilarityMatrix(cards);
  const points = getFittedPoints(getForceLayout(matrix));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (matrix[i][j] >= EDGE_SIMILARITY) {
        edges.push({ sourceId: cards[i].id, targetId: cards[j].id, similarity: matrix[i][j] });
      }
    }
  }

  const nodes = cards.map((card, index) => ({
    id: card.id,
    title: card.title,
    isTech: card.type === "technologiczna",
    x: points[index].x,
    y: points[index].y,
    neighborIds: edges.flatMap((edge) =>
      edge.sourceId === card.id ? [edge.targetId] : edge.targetId === card.id ? [edge.sourceId] : [],
    ),
  }));

  const clusters = getClusterGroups(matrix).flatMap((group) => {
    const label = group.length >= 2 ? getMostCommonTag(group.map((index) => cards[index])) : null;
    if (!label) {
      return [];
    }
    const x = group.reduce((sum, index) => sum + points[index].x, 0) / group.length;
    const y = Math.min(...group.map((index) => points[index].y)) - 34;
    return [{ label, x, y: Math.max(18, y) }];
  });

  return { nodes, edges, clusters };
}
