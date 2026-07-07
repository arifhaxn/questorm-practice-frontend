import { Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import Analytics from "./pages/Analytics";
import Analyze from "./pages/Analyze";
import Batch from "./pages/Batch";
import Dashboard from "./pages/Dashboard";
import Queue from "./pages/Queue";
import TicketDetail from "./pages/TicketDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Six routes per CLAUDE.md */}
        <Route index element={<Dashboard />} />
        <Route path="queue" element={<Queue />} />
        <Route path="tickets/:ticketId" element={<TicketDetail />} />
        <Route path="analyze" element={<Analyze />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="batch" element={<Batch />} />
      </Route>
    </Routes>
  );
}
