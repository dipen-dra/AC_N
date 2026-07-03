import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { revenueData, serviceMix } from "@/lib/mock";
import { DollarSign, Star, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: Analytics,
});

const COLORS = ["#e11d48", "#0891b2", "#22c55e", "#f59e0b", "#8b5cf6", "#64748b"];

function Analytics() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into performance, revenue and customer insights.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross revenue" value="Rs. 26.3L" delta="14.2%" icon={DollarSign} tone="success" />
        <StatCard label="Avg. ticket size" value="Rs. 3,820" delta="4.6%" icon={TrendingUp} tone="primary" />
        <StatCard label="New customers" value="+284" delta="12.9%" icon={Users} tone="info" />
        <StatCard label="Avg. rating" value="4.8/5" delta="0.2" icon={Star} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Revenue over time</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e11d48" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={3} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Service mix</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={serviceMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {serviceMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Bookings by day</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Bar dataKey="bookings" fill="#0891b2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Top performing technicians</div>
          <div className="mt-4 divide-y divide-border">
            {[
              { n: "Ramesh KC", j: 48, r: 4.9 },
              { n: "Bijay Shrestha", j: 42, r: 4.8 },
              { n: "Suman Rai", j: 39, r: 4.7 },
              { n: "Sabin Karki", j: 31, r: 4.6 },
            ].map((t) => (
              <div key={t.n} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{t.n[0]}</div>
                  <div>
                    <div className="font-semibold">{t.n}</div>
                    <div className="text-xs text-muted-foreground">{t.j} jobs this month</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-warning text-warning" /> {t.r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
