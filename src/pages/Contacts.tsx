import { Navigate } from 'react-router-dom';

// Contacts management is handled on the Engage page.
export default function Contacts() {
  return <Navigate to="/engage" replace />;
}
