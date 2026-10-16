"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatFCFA } from "@/lib/format";

export function DonutDepenses({ data }: { data: { name: string; color: string; total: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-zinc-500">Aucune dépense ce mois.</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v: unknown) => formatFCFA(Number(v ?? 0))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CourbeMensuelle({ data }: { data: { label: string; revenus: number; depenses: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" />
          <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
          <Tooltip formatter={(v: unknown) => formatFCFA(Number(v ?? 0))} />
          <Legend />
          <Bar dataKey="revenus" name="Revenus" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
