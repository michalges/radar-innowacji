import { CRITERIA, CRITERION_LABELS } from "@/lib/constants";
import { getCriterionScore } from "@/lib/rules";
import type { CriterionScore } from "@/lib/types";

const CENTER = 120;
const RADIUS = 100;

function getPoint(index: number, radius: number) {
  const angle = (index / CRITERIA.length) * 2 * Math.PI;
  return { x: CENTER + radius * Math.sin(angle), y: CENTER - radius * Math.cos(angle) };
}

function getPolygonPoints(getRadius: (index: number) => number) {
  return CRITERIA.map((_, index) => {
    const point = getPoint(index, getRadius(index));
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
}

export function ScoreRadar({ scores }: { scores: CriterionScore[] }) {
  const scorePolygon = getPolygonPoints((index) => (getCriterionScore(scores, CRITERIA[index]) / 5) * RADIUS);

  return (
    <svg viewBox="-40 -20 320 280" role="img" aria-label="Wykres radarowy oceny w 8 kryteriach" className="w-full max-w-80 self-center">
      <polygon points={getPolygonPoints(() => RADIUS)} fill="none" stroke="#E4E7EB" />
      <polygon points={getPolygonPoints(() => RADIUS * 0.6)} fill="none" stroke="#E4E7EB" />
      {CRITERIA.map((criterion, index) => {
        const edge = getPoint(index, RADIUS);
        return <line key={criterion} x1={CENTER} y1={CENTER} x2={edge.x} y2={edge.y} stroke="#ECEEF1" />;
      })}
      <polygon points={scorePolygon} fill="#0F766E" fillOpacity={0.16} stroke="#0F766E" strokeWidth={2} strokeLinejoin="round" />
      <g fontSize={10} fill="#4B4560" textAnchor="middle" aria-hidden="true">
        {CRITERIA.map((criterion, index) => {
          const label = getPoint(index, RADIUS + 16);
          return (
            <text key={criterion} x={label.x} y={label.y + 3}>
              {CRITERION_LABELS[criterion]}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
