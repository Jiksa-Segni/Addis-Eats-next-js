"use client";

/**
 * Task 31 — Revenue charts (client component).
 *
 * Renders two Recharts charts:
 *   1. Bar chart  — completed revenue by neighbourhood (ETB)
 *   2. Line chart — daily order count over time
 *
 * Both charts have a fixed minimum height to prevent layout shifts.
 * An accessible tabular representation of the data is provided by the
 * parent server component (DashboardPage) so the information is available
 * to users who cannot see the SVG charts.
 *
 * Uses Recharts 3.x API (installed in this project).
 */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

/** Format ETB values in tooltips */
function etbFormatter(value) {
  return [`${Number(value).toLocaleString()} ETB`, "Revenue"];
}

/** Custom tooltip for bar chart */
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-stone-200 text-sm">
      <p className="font-bold text-stone-900">{label}</p>
      <p className="mt-1 text-amber-700">{Number(payload[0]?.value ?? 0).toLocaleString()} ETB</p>
    </div>
  );
}

/** Custom tooltip for line chart */
function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-stone-200 text-sm">
      <p className="font-bold text-stone-900">{label}</p>
      <p className="mt-1 text-stone-700">{payload[0]?.value} orders</p>
    </div>
  );
}

export default function RevenueChart({ neighbourhoodData, ordersOverTime }) {
  return (
    <div className="space-y-10">
      {/* ── Bar chart — revenue by neighbourhood ── */}
      {neighbourhoodData.length > 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-lg font-bold text-stone-900">Revenue by neighbourhood</h2>
          <p className="mt-1 text-sm text-stone-500">
            Completed orders only · amounts in Ethiopian Birr (ETB)
          </p>
          {/* aria-hidden because a text table is provided by the parent */}
          <div aria-hidden="true" style={{ minHeight: 320 }} className="mt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={neighbourhoodData}
                margin={{ top: 8, right: 16, left: 16, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={{
                    value: "ETB",
                    angle: -90,
                    position: "insideLeft",
                    offset: -4,
                    style: { fontSize: 11, fill: "#78716c" },
                  }}
                />
                <Tooltip content={<BarTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
                  formatter={() => "Revenue (ETB)"}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* ── Line chart — orders over time ── */}
      {ordersOverTime.length > 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-lg font-bold text-stone-900">Orders over time</h2>
          <p className="mt-1 text-sm text-stone-500">
            Daily order count · excludes cancelled orders
          </p>
          <div aria-hidden="true" style={{ minHeight: 280 }} className="mt-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={ordersOverTime}
                margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  angle={-30}
                  textAnchor="end"
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  label={{
                    value: "Orders",
                    angle: -90,
                    position: "insideLeft",
                    offset: 8,
                    style: { fontSize: 11, fill: "#78716c" },
                  }}
                />
                <Tooltip content={<LineTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
                  formatter={() => "Orders placed"}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Orders"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#d97706" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
