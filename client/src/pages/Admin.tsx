import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert } from "lucide-react";
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_PRICING_RULES,
  FEATURE_FLAG_KEYS,
  PRICING_RULE_KEYS,
  DEFAULT_GPU_HOURLY_CENTS,
} from "@shared/const";
import { useMemo, useState } from "react";

type PricingRow = {
  key: string;
  costCents: number;
  priceCents: number;
};

export default function Admin() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const flagsQuery = trpc.admin.flags.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const pricingQuery = trpc.admin.pricing.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const metricsQuery = trpc.admin.metrics.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const alertsQuery = trpc.admin.alerts.list.useQuery({ limit: 25 }, {
    refetchOnWindowFocus: false,
  });

  const updateFlagMutation = trpc.admin.flags.update.useMutation({
    onSuccess: () => flagsQuery.refetch(),
  });
  const updatePricingMutation = trpc.admin.pricing.update.useMutation({
    onSuccess: () => pricingQuery.refetch(),
  });
  const updateGpuHourlyMutation = trpc.admin.pricing.updateGpuHourly.useMutation({
    onSuccess: () => pricingQuery.refetch(),
  });
  const testAlertMutation = trpc.admin.alerts.test.useMutation({
    onSuccess: () => alertsQuery.refetch(),
  });

  const [pendingGpuHourly, setPendingGpuHourly] = useState<number | null>(null);

  const pricingRows = useMemo<PricingRow[]>(() => {
    const current = pricingQuery.data?.pricing ?? DEFAULT_PRICING_RULES;
    return PRICING_RULE_KEYS.map(key => ({
      key,
      costCents: current[key]?.costCents ?? DEFAULT_PRICING_RULES[key].costCents,
      priceCents: current[key]?.priceCents ?? DEFAULT_PRICING_RULES[key].priceCents,
    }));
  }, [pricingQuery.data]);

  const gpuHourlyCents =
    pricingQuery.data?.gpuHourlyCents ?? DEFAULT_GPU_HOURLY_CENTS;

  if (loading || flagsQuery.isLoading || pricingQuery.isLoading || alertsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold">Admin Access Only</h2>
            <p className="text-muted-foreground">
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const flags = flagsQuery.data ?? {};
  const totals = metricsQuery.data?.totals ?? { total: 0 };

  const handleFlagToggle = (key: string, enabled: boolean) => {
    updateFlagMutation.mutate({ key, enabled });
  };

  const handlePricingUpdate = (row: PricingRow) => {
    updatePricingMutation.mutate({
      key: row.key,
      costCents: row.costCents,
      priceCents: row.priceCents,
    });
  };

  const handleGpuHourlyUpdate = () => {
    const value = pendingGpuHourly ?? gpuHourlyCents;
    updateGpuHourlyMutation.mutate({ gpuHourlyCents: value });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mission Control</h1>
        <p className="text-muted-foreground">
          Internal controls for feature flags, pricing, and cost visibility.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Projects</div>
          <div className="text-2xl font-semibold">{totals.total ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Draft</div>
          <div className="text-2xl font-semibold">{totals.draft ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Generating</div>
          <div className="text-2xl font-semibold">{totals.generating ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-semibold">{totals.completed ?? 0}</div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Safety Switches</h2>
            <p className="text-sm text-muted-foreground">
              Toggle features live if a provider or pipeline becomes unstable.
            </p>
          </div>
          <Badge variant="outline">Admin only</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FEATURE_FLAG_KEYS.map(flagKey => {
            const defaultFlag = DEFAULT_FEATURE_FLAGS[flagKey];
            const enabled = flags[flagKey]?.enabled ?? defaultFlag.enabled;
            return (
              <div
                key={flagKey}
                className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
              >
                <div>
                  <div className="font-medium">{flagKey}</div>
                  <div className="text-xs text-muted-foreground">
                    {flags[flagKey]?.description ?? defaultFlag.description}
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    handleFlagToggle(flagKey, checked)
                  }
                  disabled={updateFlagMutation.isPending}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pricing & Costs</h2>
            <p className="text-sm text-muted-foreground">
              Adjust pricing to maintain margin. Hover over values to compare.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={pendingGpuHourly ?? gpuHourlyCents}
              onChange={(event) =>
                setPendingGpuHourly(Number(event.target.value))
              }
              className="w-28"
            />
            <Button
              variant="outline"
              onClick={handleGpuHourlyUpdate}
              disabled={updateGpuHourlyMutation.isPending}
            >
              Update GPU/hr (cents)
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {pricingRows.map(row => {
            const profitCents = row.priceCents - row.costCents;
            const margin =
              row.priceCents > 0 ? profitCents / row.priceCents : 0;
            const breakEvenJobs =
              profitCents > 0
                ? Math.ceil(gpuHourlyCents / profitCents)
                : null;

            return (
              <div
                key={row.key}
                className="grid gap-4 rounded-lg border border-border/60 px-4 py-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]"
              >
                <div>
                  <div className="font-medium capitalize">{row.key}</div>
                  <div className="text-xs text-muted-foreground">
                    {DEFAULT_PRICING_RULES[row.key]?.costCents === 0
                      ? "CPU-friendly"
                      : "GPU-backed"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Cost (cents)</div>
                  <Input
                    type="number"
                    value={row.costCents}
                    onChange={(event) =>
                      handlePricingUpdate({
                        ...row,
                        costCents: Number(event.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Price (cents)</div>
                  <Input
                    type="number"
                    value={row.priceCents}
                    onChange={(event) =>
                      handlePricingUpdate({
                        ...row,
                        priceCents: Number(event.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Profit</div>
                  <div className="mt-2 font-semibold">
                    {(profitCents / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(margin * 100).toFixed(0)}% margin
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Break-even</div>
                  <div className="mt-2 font-semibold">
                    {breakEvenJobs ? `${breakEvenJobs} jobs/hr` : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @ {(gpuHourlyCents / 100).toFixed(2)}/hr GPU
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Night Watch Alerts</h2>
            <p className="text-sm text-muted-foreground">
              Recent warnings and critical alerts from system monitors.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => testAlertMutation.mutate()}
            disabled={testAlertMutation.isPending}
          >
            Send Test Alert
          </Button>
        </div>

        <div className="space-y-2">
          {(alertsQuery.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No alerts recorded yet.
            </div>
          ) : (
            alertsQuery.data?.map(alert => (
              <div
                key={alert.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{alert.title}</div>
                  <Badge variant={alert.level === "critical" ? "destructive" : "outline"}>
                    {alert.level}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{alert.message}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleString()}
                  {alert.jobId ? ` • Job ${alert.jobId}` : ""}
                </div>
                {alert.action && (
                  <div className="text-xs text-muted-foreground">
                    Action: {alert.action}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
