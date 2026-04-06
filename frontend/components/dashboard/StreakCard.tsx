import type { BackendUser } from "@/lib/api";
import { CardBody, CardShell } from "@/components/ui/card-shell";

export function StreakCard({ user }: { user: BackendUser }) {
  return (
    <CardShell interactive>
      <CardBody className="space-y-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Consistency
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight text-foreground">
          {user.streak}
          <span className="ml-1 text-2xl text-muted-foreground">day streak</span>
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary/80 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, user.streak * 10)}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Trust {user.trustScore} · XP {user.xp}
        </p>
      </CardBody>
    </CardShell>
  );
}
