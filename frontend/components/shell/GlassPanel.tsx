import { CardBody, CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

/** Section panel — same surface as quest / verify cards (glass reserved for nav). */
export function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(className)}>
      <CardShell>
        <CardBody className="py-6 sm:py-7">{children}</CardBody>
      </CardShell>
    </section>
  );
}
