export const chartColors = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];
export const chartTooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
};

/** Sum of `value` in the last `days` calendar days vs the equal period before. `change` is null when there is no prior data to compare. */
export function periodTotals<T extends { created_at: string }>(
  records: T[],
  days: number,
  value: (record: T) => number = () => 1,
  now = new Date(),
) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  let current = 0;
  let previous = 0;
  for (const record of records) {
    const t = new Date(record.created_at).getTime();
    if (t >= start.getTime() && t < end.getTime()) current += value(record);
    else if (t >= prevStart.getTime() && t < start.getTime())
      previous += value(record);
  }
  const change = previous
    ? ((current - previous) / previous) * 100
    : current
      ? null
      : 0;
  return { current, previous, change };
}

/** Per-day sums split by key, e.g. revenue per module. */
export function dailyBreakdown(
  records: { created_at: string; key: string; value: number }[],
  length: number,
  keys: string[],
  now = new Date(),
) {
  return Array.from({ length }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - length + 1 + index);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    const row: Record<string, number | string> = {
      day: date.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
    };
    for (const key of keys) row[key] = 0;
    for (const r of records) {
      const t = new Date(r.created_at).getTime();
      if (t >= date.getTime() && t < end.getTime() && r.key in row)
        row[r.key] = (row[r.key] as number) + r.value;
    }
    return row;
  });
}

export function dailyActivity<T extends { created_at: string }>(
  records: T[],
  length: number,
  now = new Date(),
) {
  return Array.from({ length }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - length + 1 + index);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return {
      day: date.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      count: records.filter((record) => {
        const timestamp = new Date(record.created_at).getTime();
        return timestamp >= date.getTime() && timestamp < end.getTime();
      }).length,
    };
  });
}
