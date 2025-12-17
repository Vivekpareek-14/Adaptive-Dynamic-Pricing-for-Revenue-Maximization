import React, { useState } from "react";
import { warmup } from "../api";

export default function WarmupPanel({ onWarmup }) {
  const [n, setN] = useState(30);
  const [agent, setAgent] = useState("linear_thompson");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const run = async () => {
    setBusy(true);
    setStatus({ type: "", msg: "" });

    try {
      const r = await warmup(Number(n), agent);
      // Don't dump JSON. Just tell them it worked.
      setStatus({
        type: "success",
        msg: `Model successfully trained on ${n} episodes.`,
      });
      onWarmup && onWarmup(r);
    } catch (e) {
      setStatus({
        type: "error",
        msg: e?.response?.data?.detail || e.message || "Training failed",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs">
            02
          </div>
          <h3 className="font-semibold text-slate-800">Model Warmup</h3>
        </div>
        {/* Simple Icon indicating "Training" */}
        <div className="text-slate-400">
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
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Configuration Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Agent Selection */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Select Agent Strategy
            </label>
            <div className="relative">
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-2.5 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="linear_thompson">
                  Linear Thompson Sampling
                </option>
                <option value="greedy_ols">Greedy OLS (Regression)</option>
                <option value="nonlinear_xgb">XGBoost (Non-linear)</option>
                <option value="static">Static Pricing (Control)</option>
              </select>
              {/* Custom Arrow Icon */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Iterations Input */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Training Episodes (N)
            </label>
            <div className="relative">
              <input
                type="number"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 font-medium">
                SAMPLES
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={run}
          disabled={busy}
          className={`
                w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  busy
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg shadow-indigo-200"
                }
            `}
        >
          {busy ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Training Model...
            </>
          ) : (
            "Run Warmup Sequence"
          )}
        </button>

        {/* Status Messages */}
        {status.msg && (
          <div
            className={`
                p-3 rounded-lg text-sm flex items-start gap-2
                ${
                  status.type === "error"
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {status.type === "error" ? (
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span>{status.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
