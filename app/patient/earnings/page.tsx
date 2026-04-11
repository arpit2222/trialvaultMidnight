"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useEarnings } from "@/hooks/useEarnings";
import type { EarningRecord } from "@/hooks/useEarnings";

/**
 * SVG sparkline — replaces recharts to avoid React 18 / TypeScript incompatibility.
 * Privacy role: shows only anonymised aggregate earnings, no health data.
 */
function EarningsSparkline({ data }: { data: EarningRecord[] }) {
  if (data.length < 2) return null;

  const W = 600;
  const H = 120;
  const pad = 32;

  const amounts = data.map((d) => d.amount);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.amount - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });
  const polyline = points.join(" ");

  // Fill path under the line
  const fillPath =
    `M ${points[0]} ` +
    points.slice(1).join(" L ") +
    ` L ${pad + (W - pad * 2)},${H - pad} L ${pad},${H - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="TVAULT earnings over time"
    >
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((pct) => {
        const val = Math.round(min + pct * range);
        const y = H - pad - pct * (H - pad * 2);
        return (
          <g key={pct}>
            <line x1={pad - 4} y1={y} x2={W - pad} y2={y} stroke="#334155" strokeDasharray="4 4" />
            <text x={pad - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#64748b">
              {val}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        return (
          <text key={d.txHash} x={x} y={H - 8} textAnchor="middle" fontSize={10} fill="#64748b">
            {d.date.slice(5)}
          </text>
        );
      })}

      {/* Area fill */}
      <path d={fillPath} fill="#27C28A" fillOpacity={0.1} />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#27C28A" strokeWidth={2} strokeLinejoin="round" />

      {/* Dots */}
      {data.map((d, i) => {
        const [x, y] = (points[i] ?? "0,0").split(",").map(Number);
        return (
          <circle key={d.txHash} cx={x} cy={y} r={4} fill="#27C28A">
            <title>{d.amount} TVAULT · {d.date}</title>
          </circle>
        );
      })}
    </svg>
  );
}

/**
 * EarningsPage shows TVAULT token earnings without revealing health data.
 */
export default function EarningsPage() {
  const { earnings, total, pending } = useEarnings();

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 p-6">
        <p className="text-xs text-muted-foreground">Total TVAULT earned</p>
        <p className="text-4xl font-semibold text-white">{total}</p>
        <p className="mt-1 text-xs text-brand-mint">TVAULT</p>
      </Card>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Earnings over time</h2>
        <div className="mt-4">
          <EarningsSparkline data={earnings} />
        </div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Transactions</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Fields Disclosed</TableHead>
              <TableHead>TVAULT</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.map((row) => (
              <TableRow key={row.txHash}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.trial}</TableCell>
                <TableCell>{row.fields}</TableCell>
                <TableCell className="text-brand-mint font-medium">{row.amount}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{row.txHash}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pending royalties</p>
            <p className="text-xl font-semibold text-white">{pending} TVAULT</p>
          </div>
          <Button
            onClick={async () => {
              const { runTxStatus } = await import("@/lib/tx");
              await runTxStatus();
            }}
          >
            Claim All Royalties
          </Button>
        </div>
      </Card>
    </div>
  );
}
