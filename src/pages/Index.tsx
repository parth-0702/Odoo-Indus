import { Navigate } from "react-router-dom";

export default function Index() {
  // Redirect the app root to the dashboard.
  return <Navigate to="/dashboard" replace />;
}
