import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowUpRight, Calendar, DollarSign, MoreHorizontal, Users, Wrench } from "lucide-react";
import { AdminShell, StatCard } from "@/components/admin-shell";
import { getAdminAnalytics, getBookings } from "@/lib/db-server";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => {
    if (!context.user || (context.user.role !== "Admin" && context.user.role !== "Superadmin")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => {
    const [analytics, bookings] = await Promise.all([
      getAdminAnalytics(),
      getBookings(),
    ]);
    return { analytics, bookings };
  },
  head: () => ({ meta: [{ title: "Admin Dashboard — AutoCare Nepal" }] }),
  component: AdminHome,
});

const COLORS = ["#e11d48", "#0891b2", "#22c55e", "#f59e0b", "#8b5cf6", "#64748b"];

function AdminHome() {
  const { analytics, bookings } = Route.useLoaderData();
  const { summary, revenueData, serviceMix } = analytics;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm"><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Export</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={`Rs. ${(summary.completedRevenue / 100000).toFixed(2)}L`} delta="12.4% MoM" icon={DollarSign} tone="success" />
        <StatCard label="Bookings" value={String(summary.totalBookings)} delta="8.2%" icon={Calendar} tone="primary" />
        <StatCard label="Active Customers" value={String(summary.customerCount)} delta="3.1%" icon={Users} tone="info" />
        <StatCard label="Services live" value="6" icon={Wrench} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">Revenue trend</div>
              <div className="text-sm text-muted-foreground">Monthly revenue & bookings</div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-lg border border-border"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="bookings" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Service mix</div>
          <div className="text-sm text-muted-foreground">Last 30 days</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {serviceMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {serviceMix.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 text-muted-foreground">{s.name}</span>
                <span className="font-semibold">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-6">
            <div className="text-lg font-bold">Recent bookings</div>
            <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">View all <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>{["Booking", "Customer", "Service", "Amount", "Status"].map((h) => <th key={h} className="px-6 py-3 text-left font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-3 font-semibold">{b.id}</td>
                    <td className="px-6 py-3">{b.customer}</td>
                    <td className="px-6 py-3">{b.service}</td>
                    <td className="px-6 py-3 font-bold">Rs. {b.price.toLocaleString()}</td>
                    <td className="px-6 py-3"><StatusPill status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-lg font-bold">Weekly bookings</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { d: "Mon", v: 22 }, { d: "Tue", v: 28 }, { d: "Wed", v: 31 }, { d: "Thu", v: 25 },
                { d: "Fri", v: 38 }, { d: "Sat", v: 44 }, { d: "Sun", v: 19 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="v" fill="#e11d48" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    "In Progress": "bg-primary-soft text-primary",
    Upcoming: "bg-info/15 text-info",
    Confirmed: "bg-success/15 text-success",
    Completed: "bg-success/15 text-success",
    Cancelled: "bg-destructive/15 text-destructive",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone[status] ?? "bg-secondary")}>{status}</span>;
}
