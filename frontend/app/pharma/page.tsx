"use client";

import { useMemo } from "react";
import { useTrials } from "@/hooks/useTrials";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table";
import type { Trial } from "@/types/trial";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const columns: ColumnDef<Trial>[] = [
  { accessorKey: "name", header: "Trial Name" },
  { accessorKey: "phase", header: "Phase" },
  { accessorKey: "eligibleCount", header: "Eligible Count" },
  { accessorKey: "consentCount", header: "Consent Count" },
  { accessorKey: "status", header: "Status" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`/pharma/trials/${row.original.id.toString()}`}>View</Link>
      </Button>
    ),
  },
];

/**
 * PharmaDashboard displays aggregate stats without exposing patient identities.
 */
export default function PharmaDashboard() {
  const { trials, isLoading } = useTrials();
  const stats = useMemo(() => {
    const totalTrials = trials.length;
    const eligible = trials.reduce((sum, t) => sum + t.eligibleCount, 0);
    const consents = trials.reduce((sum, t) => sum + t.consentCount, 0);
    const alerts = 1;
    return { totalTrials, eligible, consents, alerts };
  }, [trials]);

  const table = useReactTable({ data: trials, columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading trials...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total trials", value: stats.totalTrials },
          { label: "Eligible patients", value: stats.eligible },
          { label: "Consents received", value: stats.consents },
          { label: "Active alerts", value: stats.alerts },
        ].map((stat) => (
          <Card key={stat.label} className="border-white/10 bg-white/5 p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent trials</h2>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
