import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Inspections() {
  const navigate = useNavigate();

  // Redirect to dashboard — inspections have been removed
  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <main className="p-4 md:p-10 w-full">
      <h1 className="text-xl font-semibold">Inspections removed</h1>
      <p className="mt-4 text-sm text-gray-600">The inspections feature has been removed. You are being redirected to the dashboard.</p>
    </main>
  );
}
