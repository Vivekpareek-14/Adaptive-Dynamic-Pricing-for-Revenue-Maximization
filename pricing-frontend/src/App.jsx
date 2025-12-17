import React, { useState } from "react";
import Header from "./components/Header";
import DatasetUpload from "./components/DatasetUpload";
import WarmupPanel from "./components/WarmupPanel";
import PredictPanel from "./components/PredictPanel";
import UpdatePanel from "./components/UpdatePanel";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [lastContext, setLastContext] = useState(null);
  const [lastPrediction, setLastPrediction] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Header />

      {/* LAYOUT FIX (FLEXBOX):
         1. 'flex flex-col lg:flex-row': Stacks vertically on mobile, side-by-side on desktop.
         2. 'w-full': Ensures the container spans 100% of the screen width.
      */}
      <main className="flex flex-col lg:flex-row w-full gap-8 px-4 sm:px-6 lg:px-8 py-8">
        {/* --- LEFT SIDEBAR --- */}
        {/* lg:w-[350px]: Fixed width of 350px on desktop.
            lg:flex-shrink-0: Prevents the sidebar from getting squished.
        */}
        <aside className="w-full lg:w-[350px] lg:flex-shrink-0 space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              System Setup
            </h2>
          </div>

          <div className="space-y-6">
            <DatasetUpload onUploaded={(d) => console.log("uploaded", d)} />
            <WarmupPanel onWarmup={(d) => console.log("warmup", d)} />
          </div>

          <div className="pt-6 border-t border-slate-200 mt-6">
            <p className="text-xs text-slate-400 text-center">
              Pricing Engine v1.0
            </p>
          </div>
        </aside>

        {/* --- RIGHT CONTENT AREA --- */}
        {/* flex-1: The magic property. It tells this div to grow and fill 
            ALL remaining space to the right of the sidebar.
            min-w-0: Prevents charts from causing horizontal overflow.
        */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* 1. DECISION ENGINE (Inputs) */}
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="h-1 w-1 rounded-full bg-amber-500"></div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Decision Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PredictPanel
                onPredicted={(ctx, res) => {
                  setLastContext(ctx);
                  setLastPrediction(res);
                }}
              />
              <UpdatePanel
                lastContext={lastContext}
                lastPrediction={lastPrediction}
              />
            </div>
          </div>

          {/* 2. LIVE ANALYTICS (Dashboard) */}
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Live Analytics
              </h2>
            </div>
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  );
}
