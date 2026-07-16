"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WeeklyTotal } from "@/lib/data/giving";

const BAR_WIDTH = 28;
const GAP = 8;
const CHART_HEIGHT = 120;

function formatWeekLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

export function GivingTrendChart({ trend }: { trend: WeeklyTotal[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(...trend.map((week) => week.total), 1);
  const width = trend.length * (BAR_WIDTH + GAP) - GAP;

  return (
    <div>
      <h3 className="text-base font-medium text-foreground">8-week trend</h3>
      <div className="mt-2 overflow-x-auto">
        <svg
          role="img"
          aria-label="Weekly giving totals for the last 8 weeks"
          width={width}
          height={CHART_HEIGHT + 24}
          className="min-w-full"
        >
          <line
            x1={0}
            y1={CHART_HEIGHT}
            x2={width}
            y2={CHART_HEIGHT}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
          {trend.map((week, i) => {
            const barHeight =
              week.total > 0 ? Math.max((week.total / max) * (CHART_HEIGHT - 8), 4) : 0;
            const x = i * (BAR_WIDTH + GAP);
            const y = CHART_HEIGHT - barHeight;

            return (
              <g key={week.weekStart}>
                <rect
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  rx={4}
                  tabIndex={0}
                  role="button"
                  aria-label={`Week of ${formatWeekLabel(week.weekStart)}: ${formatCurrency(week.total, "GHS")}`}
                  className={cn(
                    "cursor-pointer outline-none",
                    hoverIndex === i ? "fill-primary-700" : "fill-primary-600"
                  )}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                />
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT + 16}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {formatWeekLabel(week.weekStart)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-1 min-h-5 text-center text-sm text-muted-foreground">
        {hoverIndex !== null ? (
          <>
            Week of {formatWeekLabel(trend[hoverIndex].weekStart)}:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(trend[hoverIndex].total, "GHS")}
            </span>
          </>
        ) : (
          "Tap a bar for that week's total"
        )}
      </p>
    </div>
  );
}
