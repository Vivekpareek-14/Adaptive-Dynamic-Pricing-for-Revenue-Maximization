import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { graphData } from "../api";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await graphData(300);
      console.log(r);
      const obs = r.observations || [];
      const mapped = obs.map((rec, i) => ({
        idx: i,
        price: rec._price_ || rec.price || null,
        sales: rec.sales || null,
        predicted: rec.predicted_sales || null,
      }));
      setData(mapped);
    } finally {
      setLoading(false);
    }
  }

  // useEffect(() => {
  //   load();
  //   const id = setInterval(load, 5000);
  //   return () => clearInterval(id);
  // }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
            STEP 5
          </div>
          <h3 className="font-semibold text-lg">Dashboard</h3>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-black"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="w-full overflow-auto">
        <LineChart width={900} height={350} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="idx" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#6366F1"
            dot={false}
          />
          <Line type="monotone" dataKey="sales" stroke="#10B981" dot={false} />
        </LineChart>
      </div>
    </div>
  );
}
