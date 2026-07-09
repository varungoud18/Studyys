import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="p-4 bg-red-50 text-red-500 rounded-full inline-block border border-red-100 animate-bounce">
          <AlertCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-6xl font-black text-slate-800 tracking-tight">404</h1>
        
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-700">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-gradient-brand text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
