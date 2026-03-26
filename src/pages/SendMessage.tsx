import { Navigate } from 'react-router-dom';

// Send message is handled on the Engage page.
export default function SendMessage() {
  return <Navigate to="/engage" replace />;
}
