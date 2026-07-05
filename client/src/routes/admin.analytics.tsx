import { createFileRoute, redirect } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { DollarSign, Star, TrendingUp, Users } from "lucide-react";
import { getAdminAnalytics } from "@/lib/db-server";

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: () => getAdminAnalytics(),
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  component: Analytics,
});

const COLORS = ["#e11d48", "#0891b2", "#22c55e", "#f59e0b", "#8b5cf6", "#64748b"];

function Analytics() {
  const data = Route.useLoaderData();
  const summary = data?.summary || { completedRevenue: 0, totalBookings: 0, customerCount: 0 };
  const rData = data?.revenueData || [];
  const sMix = data?.serviceMix || [];
  const topTechs = data?.topTechnicians || [];

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into performance, revenue and customer insights.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross revenue" value={`Rs. ${summary.completedRevenue.toLocaleString()}`} delta={summary.revenueDelta} icon={DollarSign} tone="success" />
        <StatCard label="Total bookings" value={summary.totalBookings.toString()} delta={summary.bookingsDelta} icon={TrendingUp} tone="primary" />
        <StatCard label="Total customers" value={summary.customerCount.toString()} delta={summary.customersDelta} icon={Users} tone="info" />
        <StatCard label="Services live" value={String(summary.servicesCount || 0)} icon={Star} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Revenue Over Time</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={rData}>
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
          <div className="text-lg font-bold">Service Mix</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {sMix.map((_: any, i: any) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <div className="text-lg font-bold">Bookings By Day</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={summary.weeklyBookings || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Bar dataKey="v" fill="#0891b2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Top Performing Technicians</div>
          <div className="mt-4 divide-y divide-border">
            {topTechs.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">No technician data available.</div>
            ) : topTechs.map((t: any) => (
              <div key={t.n} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{t.n[0]}</div>
                  <div>
                    <div className="font-semibold">{t.n}</div>
                    <div className="text-xs text-muted-foreground">{t.j} jobs overall</div>
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
