import { Navigate } from "react-router-dom";

export default function Index() {
  // First-time flow starts with creating a Warehouse.
  return <Navigate to="/warehouses" replace />;
}
