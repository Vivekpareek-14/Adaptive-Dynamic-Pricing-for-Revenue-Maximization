import React, { useState } from "react";
import Header from "./components/Header";
import DatasetUpload from "./components/DatasetUpload";
import WarmupPanel from "./components/WarmupPanel";
import PredictPanel from "./components/PredictPanel";
import UpdatePanel from "./components/UpdatePanel";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [lastContext, setLastContext] = useState(null);

  return (
    <div>
      <Header />
      <main className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <DatasetUpload onUploaded={(d) => console.log("uploaded", d)} />
          <WarmupPanel onWarmup={(d) => console.log("warmup", d)} />
          <PredictPanel onPredicted={(ctx, res) => setLastContext(ctx)} />
          <UpdatePanel lastContext={lastContext} />
        </div>

        <div className="md:col-span-2">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
