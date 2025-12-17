import React, { useState } from "react";
import { predict } from "../api";

export default function PredictPanel({ onPredicted }) {
  // Formatted the default JSON so it doesn't look like a mess on load
  const [ctxText, setCtxText] = useState(
    JSON.stringify(
      {
        Product_ID: 1052,
        Unit_Cost: 152.75,
        Unit_Price: 267.22,
        Discount: 0.09,
        Product_Category: "Furniture",
        Region: "North",
      },
      null,
      2
    )
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const doPredict = async () => {
    setError(null);
    let ctx;

    // 1. Validation Logic: Don't just crash if the JSON is bad
    try {
      ctx = JSON.parse(ctxText);
    } catch (e) {
      setError(
        "Invalid JSON format. Please check your syntax (commas, quotes)."
      );
      return;
    }

    setLoading(true);
    try {
      const r = await predict(ctx, null);
      setResult(r);
      onPredicted && onPredicted(ctx, r);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs">
            03
          </div>
          <h3 className="font-semibold text-slate-800">Predict & Optimize</h3>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Input Label */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Context Parameters (JSON)
          </label>
          {/* The "Code Editor" Look */}
          <div className="relative">
            <textarea
              rows={8}
              spellCheck="false"
              className="w-full bg-slate-900 text-indigo-100 font-mono text-sm rounded-xl p-4 border border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none shadow-inner"
              value={ctxText}
              onChange={(e) => setCtxText(e.target.value)}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={doPredict}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
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
              Running Models...
            </>
          ) : (
            <>
              <span>Run Prediction Agent</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </>
          )}
        </button>

        {/* Error Message - Inline, not Alert */}
        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-sm flex items-start gap-2 animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Results Display */}
        {result && result.ok && (
          <div className="mt-2 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <h4 className="text-sm font-bold text-slate-700 uppercase">
                Optimization Results
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Result Card 1: Price */}
              <div className="col-span-2 bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                <p className="text-xs text-indigo-500 font-semibold uppercase">
                  Proposed Price
                </p>
                <p className="text-2xl font-bold text-indigo-700">
                  ${result.result.proposed_price.toFixed(2)}
                </p>
              </div>

              {/* Result Card 2: Sales */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Exp. Sales</p>
                <p className="text-lg font-semibold text-slate-700">
                  {result.result.predicted_sales.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    units
                  </span>
                </p>
              </div>

              {/* Result Card 3: Revenue */}
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                <p className="text-xs text-emerald-600 font-medium">
                  Est. Revenue
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  ${result.result.expected_revenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
