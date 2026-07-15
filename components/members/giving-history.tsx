import { formatCurrency, formatDate } from "@/lib/format";
import type { GivingRecordWithFund } from "@/lib/data/members";

const METHOD_LABELS: Record<string, string> = {
  paystack: "Paystack",
  momo_manual: "Mobile Money",
  cash: "Cash",
};

export function GivingHistory({
  records,
  canView,
}: {
  records: GivingRecordWithFund[];
  canView: boolean;
}) {
  if (!canView) {
    return (
      <p className="text-base text-muted-foreground">
        Only admins and pastors can view giving history.
      </p>
    );
  }

  if (records.length === 0) {
    return <p className="text-base text-muted-foreground">No giving recorded yet.</p>;
  }

  const total = records.reduce((sum, record) => sum + Number(record.amount), 0);

  return (
    <div className="space-y-3">
      <p className="text-base text-muted-foreground">
        Total:{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(total, records[0].currency)}
        </span>
      </p>
      <ul className="space-y-2">
        {records.map((record) => (
          <li
            key={record.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
          >
            <div>
              <p className="font-medium text-foreground">{record.fund?.name ?? "Giving"}</p>
              <p className="text-sm text-muted-foreground">
                {METHOD_LABELS[record.method] ?? record.method} · {formatDate(record.given_at)}
              </p>
            </div>
            <p className="font-semibold text-foreground">
              {formatCurrency(Number(record.amount), record.currency)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
