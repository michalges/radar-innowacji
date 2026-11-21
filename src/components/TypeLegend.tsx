export function TypeLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-[13px] text-ink-soft">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-teal" />
        technologiczne
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-lime" />
        organizacyjne i społeczne
      </span>
      <span>środek = gotowe do wdrożenia</span>
    </div>
  );
}
