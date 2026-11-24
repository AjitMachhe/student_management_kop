import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false, text = 'Loading data...' }) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm font-medium text-slate-600">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}