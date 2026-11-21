import Form from "next/form";

export function SearchBox({ query }: { query: string }) {
  return (
    <Form action="/wyzwania" role="search" className="w-full">
      <div className="glass flex items-center gap-2 rounded-full py-2 pr-2 pl-5 sm:pl-6 transition-shadow focus-within:shadow-[0_0_0_3px_rgb(14_116_124/0.2),0_8px_32px_rgb(27_21_48/0.1)]">
        <span aria-hidden="true" className="text-lg text-teal">
          ✦
        </span>
        <input
          key={query}
          name="q"
          type="search"
          defaultValue={query}
          required
          minLength={3}
          autoComplete="off"
          aria-label="Opisz problem, którego rozwiązania szukasz"
          placeholder="Np. smog przy szkołach"
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-ink sm:text-[17px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          className="h-12 shrink-0 cursor-pointer rounded-full bg-teal px-5 font-semibold text-white transition-colors hover:bg-teal-dark sm:px-6"
        >
          Szukaj
        </button>
      </div>
    </Form>
  );
}
