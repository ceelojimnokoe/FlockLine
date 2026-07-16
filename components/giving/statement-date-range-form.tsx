// Plain GET form — navigates via query string on submit, no JS required.
export function StatementDateRangeForm({ from, to }: { from?: string; to?: string }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 print:hidden">
      <div>
        <label htmlFor="from" className="mb-1.5 block text-sm font-medium text-foreground">
          From
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          className="min-h-tap rounded-xl border border-input bg-card px-3 text-base text-foreground"
        />
      </div>
      <div>
        <label htmlFor="to" className="mb-1.5 block text-sm font-medium text-foreground">
          To
        </label>
        <input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          className="min-h-tap rounded-xl border border-input bg-card px-3 text-base text-foreground"
        />
      </div>
      <button
        type="submit"
        className="min-h-tap rounded-xl border border-border px-4 text-sm font-medium text-foreground"
      >
        Apply
      </button>
    </form>
  );
}
