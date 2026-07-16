"use client";

export function StatementPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-tap w-full rounded-xl bg-primary-600 px-5 text-base font-medium text-primary-foreground print:hidden"
    >
      Print or save as PDF
    </button>
  );
}
