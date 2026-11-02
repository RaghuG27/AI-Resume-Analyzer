import AppShell from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <AppShell>
      <PageSkeleton />
    </AppShell>
  );
}
