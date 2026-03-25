import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { setPassword, clearPassword } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function PasswordGate({ onAuthenticated }) {
  const [input, setInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/verify`, {
        headers: { 'X-App-Password': input },
      });

      if (res.ok) {
        setPassword(input);
        onAuthenticated();
      } else if (res.status === 401) {
        clearPassword();
        setError('Napačno geslo. Poskusite znova.');
        setInput('');
      } else {
        setError(`Napaka strežnika (${res.status}). Poskusite znova.`);
      }
    } catch {
      setError('Strežnik ni dosegljiv. Preverite povezavo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header card */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-2xl p-8 text-center text-white shadow-lg">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Dalux Manager</h1>
          <p className="text-slate-300 text-sm mt-1">Vnesi geslo za dostop</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-b-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Geslo"
                autoFocus
                className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Preverjanje...' : 'Vstopi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
