import { NextResponse } from "next/server";
import { getCurrentChurchUser, canViewGiving } from "@/lib/data/church";
import { getTransactions } from "@/lib/data/giving";
import { GIVING_METHOD_LABELS, GIVING_METHODS, type GivingMethod } from "@/lib/validation/giving";
import { formatDate } from "@/lib/format";

const EXPORT_CAP = 5000;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Exports as CSV rather than a real .xlsx — every spreadsheet app
 * (including Excel) opens CSV directly, and this avoids pulling in an
 * xlsx-writing dependency for what's otherwise a plain tabular export.
 */
export async function GET(request: Request) {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser || !canViewGiving(churchUser.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const fundId = url.searchParams.get("fundId") || undefined;
  const methodParam = url.searchParams.get("method");
  const method = GIVING_METHODS.includes(methodParam as GivingMethod)
    ? (methodParam as GivingMethod)
    : undefined;
  const q = url.searchParams.get("q") || undefined;

  const { records } = await getTransactions({ from, to, fundId, method, q }, 0, EXPORT_CAP);

  const header = ["Date", "Giver", "Fund", "Method", "Amount", "Currency", "Reference"];
  const rows = records.map((r) => [
    formatDate(r.given_at),
    r.member ? `${r.member.first_name} ${r.member.last_name}` : "Anonymous",
    r.fund?.name ?? "",
    GIVING_METHOD_LABELS[r.method as GivingMethod] ?? r.method,
    String(r.amount),
    r.currency,
    r.reference ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="giving-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
