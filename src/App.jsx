import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Reports from "./pages/Reports.jsx";
import Scanner from "./pages/Scanner.jsx";
import Medicines from "./pages/Medicines.jsx";
import BodySimulation from "./pages/BodySimulation.jsx";
import Timeline from "./pages/Timeline.jsx";
import Reminders from "./pages/Reminders.jsx";
import Summary from "./pages/Summary.jsx";
import Family from "./pages/Family.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="medicines" element={<Medicines />} />
        <Route path="symptoms" element={<BodySimulation />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="summary" element={<Summary />} />
        <Route path="family" element={<Family />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
