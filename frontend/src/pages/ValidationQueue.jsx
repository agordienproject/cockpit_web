import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ValidationQueue() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <main className="p-4 md:p-10 w-full">
      <h1 className="text-xl font-semibold">Validation queue removed</h1>
      <p className="mt-4 text-sm text-gray-600">The validation queue feature has been removed. Redirecting to dashboard.</p>
    </main>
  );
}