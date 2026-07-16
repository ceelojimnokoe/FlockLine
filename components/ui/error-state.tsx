import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <AlertTriangle aria-hidden="true" className="h-8 w-8 text-destructive" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-base text-muted-foreground">{description}</p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}
