import React, { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { graphData } from "../api";

// Custom Tooltip with cleaner typography
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-2xl text-white min-w-[200px]">
        <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
          <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">
            Episode {label}
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
            Live
          </span>
        </div>

        <div className="space-y-3">
          {/* Actual Sales */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
              <span className="text-sm text-slate-300">Actual Sales</span>
            </div>
            <span className="text-base font-bold text-white font-mono">
              {payload[1].value}
            </span>
          </div>

          {/* Predicted Sales */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
              <span className="text-sm text-slate-300">Predicted</span>
            </div>
            <span className="text-base font-bold text-white font-mono">
              {payload[0].value}
            </span>
          </div>

          {/* Context Data (Price) */}
          <div className="pt-2 mt-2 border-t border-slate-700/50 flex justify-between items-center">
            <span className="text-xs text-slate-500">Price Point</span>
            <span className="text-sm font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ${payload[0].payload.price}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Cursor (The glowing bar behind the hover)
const CustomCursor = (props) => {
  const { points, width, height } = props;
  const { x, y } = points[0];
  return (
    <rect
      x={x - 1}
      y={y}
      width="2"
      height={height}
      fill="#6366f1"
      fillOpacity={0.1}
      className="animate-pulse"
    />
  );
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const metrics = useMemo(() => {
    if (!data.length) return { revenue: 0, avgPrice: 0, totalSales: 0 };
    const totalSales = data.reduce((acc, r) => acc + (r.sales || 0), 0);
    const revenue = data.reduce(
      (acc, r) => acc + (r.sales || 0) * (r.price || 0),
      0
    );
    const avgPrice =
      data.reduce((acc, r) => acc + (r.price || 0), 0) / data.length;
    return { revenue, avgPrice, totalSales };
  }, [data]);

  async function load() {
    setLoading(true);
    try {
      const r = await graphData(300);
      const obs = r.observations || [];
      const mapped = obs.map((rec, i) => ({
        idx: i,
        price: Number(rec._price_ || rec.price || 0).toFixed(2),
        sales: Number(rec.sales || 0),
        predicted: Number(rec.predicted_sales || 0),
      }));
      setData(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Metric Cards Row - Kept your structure, just tightened spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: "Est. Revenue",
            val: `$${metrics.revenue.toLocaleString()}`,
            color: "emerald",
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          },
          {
            label: "Volume Sold",
            val: metrics.totalSales,
            sub: "units",
            color: "indigo",
            icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
          },
          {
            label: "Avg Price",
            val: `$${metrics.avgPrice.toFixed(2)}`,
            color: "amber",
            icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {item.label}
              </span>
              <div
                className={`p-2 bg-${item.color}-50 text-${item.color}-600 rounded-lg`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">
                {item.val}
              </span>
              {item.sub && (
                <span className="text-sm font-medium text-slate-400">
                  {item.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Main Chart Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header with Integrated Legend and Controls */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              Demand Velocity
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Real-time inference vs ground truth
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Custom Legend */}
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm ring-1 ring-indigo-200"></span>
                <span className="text-slate-600">Predicted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm ring-1 ring-emerald-200"></span>
                <span className="text-slate-600">Actual</span>
              </div>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart Body */}
        <div className="h-[450px] w-full relative group">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Richer Gradients */}
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Subtle Grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              {/* Clean Axes */}
              <XAxis
                dataKey="idx"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
                dy={10}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
                tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)} // Intelligent formatting
                width={40}
              />

              <Tooltip cursor={<CustomCursor />} content={<CustomTooltip />} />

              {/* Bold Lines with Glow Effect */}
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#6366F1"
                strokeWidth={3}
                fill="url(#colorPred)"
                activeDot={{
                  r: 6,
                  strokeWidth: 0,
                  fill: "#6366F1",
                  className: "animate-ping",
                }}
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#colorSales)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#10B981" }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
