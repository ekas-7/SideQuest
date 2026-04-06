import type { BackendUser } from "@/lib/api";

const labels = {
  strength: "Strength",
  agility: "Agility",
  intelligence: "Intelligence",
} as const;

export function StatPills({ user }: { user: BackendUser }) {
  const stats: { key: keyof typeof labels; value: number }[] = [
    { key: "strength", value: user.strength },
    { key: "agility", value: user.agility },
    { key: "intelligence", value: user.intelligence },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map(({ key, value }) => (
        <div
          key={key}
          className="sq-badge border-border/80 bg-background/40 text-muted-foreground"
        >
          <span className="text-foreground">{labels[key]}</span>
          <span className="ml-1 tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}
