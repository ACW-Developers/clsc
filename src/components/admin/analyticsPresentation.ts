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
