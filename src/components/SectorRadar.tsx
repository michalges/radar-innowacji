import { SECTORS, SECTOR_LABELS, type Sector } from "@/lib/constants";
import { getPolarPoint, getRadarPosition, isTechnological, RADAR_CENTER, RADAR_RADIUS } from "@/lib/rules";
import type { Card } from "@/lib/types";

const SECTOR_STYLES: Record<Sector, { fill: string; label: string }> = {
  motoryzacja: { fill: "#ECFDF5", label: "#3F6212" },
  "jakosc-zycia": { fill: "#F7FEE7", label: "#135C38" },
  ict: { fill: "#E0F2F1", label: "#074A5C" },
  lotnictwo: { fill: "#F0FDFA", label: "#155E75" },
  kosmos: { fill: "#FEFCE8", label: "#713F12" },
};

const SECTOR_ANGLE = 360 / SECTORS.length;
const LABEL_RADIUS = RADAR_RADIUS + 26;

function getSectorPath(index: number): string {
  const start = getPolarPoint(index * SECTOR_ANGLE, RADAR_RADIUS);
  const end = getPolarPoint((index + 1) * SECTOR_ANGLE, RADAR_RADIUS);
  return `M${RADAR_CENTER} ${RADAR_CENTER} L${start.x} ${start.y} A${RADAR_RADIUS} ${RADAR_RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
}

type RadarCard = Pick<Card, "id" | "title" | "sector" | "readiness" | "type" | "status">;

export function SectorRadar({
  cards,
  selectedId,
  onSelect,
}: {
  cards: RadarCard[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const selected = cards.find((card) => card.id === selectedId);
  const selectedPoint = selected ? getRadarPosition(selected) : null;

  return (
    <svg
      viewBox="-70 -20 500 410"
      role="img"
      aria-label="Radar innowacji w pięciu sektorach PCI; im bliżej środka, tym wyższa gotowość"
      className="w-full max-w-170"
    >
      {SECTORS.map((sector, index) => (
        <path key={sector} d={getSectorPath(index)} fill={SECTOR_STYLES[sector].fill} />
      ))}
      <circle cx={RADAR_CENTER} cy={RADAR_CENTER} r={107} fill="none" stroke="#fff" strokeWidth={1.5} />
      <circle cx={RADAR_CENTER} cy={RADAR_CENTER} r={53} fill="#fff" fillOpacity={0.7} stroke="#fff" strokeWidth={1.5} />
      {SECTORS.map((sector, index) => {
        const edge = getPolarPoint(index * SECTOR_ANGLE, RADAR_RADIUS);
        return <path key={sector} d={`M${RADAR_CENTER} ${RADAR_CENTER} L${edge.x} ${edge.y}`} stroke="#fff" strokeWidth={1.5} />;
      })}
      <circle cx={RADAR_CENTER} cy={RADAR_CENTER} r={RADAR_RADIUS} fill="none" stroke="#1B1530" strokeOpacity={0.12} />
      <g fontSize={9} fontWeight={600} fill="#6B6580" letterSpacing="0.08em" aria-hidden="true">
        <text x={185} y={152}>GOTOWE</text>
        <text x={185} y={99}>PILOTAŻ</text>
        <text x={185} y={45}>POMYSŁ</text>
      </g>
      {selectedPoint && <circle cx={selectedPoint.x} cy={selectedPoint.y} r={22} fill="#0A6178" fillOpacity={0.18} />}
      {cards.map((card) => {
        const point = getRadarPosition(card);
        return (
          <circle
            key={card.id}
            cx={point.x}
            cy={point.y}
            r={8}
            fill={isTechnological(card) ? "#0A6178" : "#A3E635"}
            fillOpacity={card.status === "niepotwierdzona" ? 0.45 : 1}
            stroke="#1B1530"
            strokeOpacity={0.3}
            className={onSelect ? "cursor-pointer" : undefined}
            onClick={onSelect ? () => onSelect(card.id) : undefined}
          >
            <title>{card.title}</title>
          </circle>
        );
      })}
      {selectedPoint && (
        <circle cx={selectedPoint.x} cy={selectedPoint.y} r={14} fill="none" stroke="#1B1530" strokeOpacity={0.5} strokeWidth={1.25} />
      )}
      <g className="font-display" fontWeight={600} fontSize={15} textAnchor="middle">
        {SECTORS.map((sector, index) => {
          const point = getPolarPoint((index + 0.5) * SECTOR_ANGLE, LABEL_RADIUS);
          return (
            <text key={sector} x={point.x} y={point.y + 5} fill={SECTOR_STYLES[sector].label}>
              {SECTOR_LABELS[sector]}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
