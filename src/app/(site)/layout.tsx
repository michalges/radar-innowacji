export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-330 flex-1 flex-col gap-8 px-4 py-9 sm:px-8 lg:px-14">{children}</main>
      <footer className="border-t border-line-soft px-4 py-6 text-center text-sm text-muted">Oceny generuje AI według jawnych kryteriów.</footer>
    </>
  );
}
