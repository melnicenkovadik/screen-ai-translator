'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [isElectronMode, setIsElectronMode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    setIsElectronMode(mode === 'electron');
  }, []);

  const continueLocalMode = () => {
    if (isElectronMode) {
      window.location.href =
        'pickleglass://auth-success?uid=default_user&email=contact@pickle.com&displayName=Default%20User';
      return;
    }
    router.push('/settings');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Smart AI Translator</h1>
        <p className="text-gray-600 mt-2">Local mode only. Your data stays on your own setup.</p>
        {isElectronMode ? (
          <p className="text-sm text-blue-600 mt-1 font-medium">Linking back to desktop app</p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Use local mode in the browser.</p>
        )}
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <button
            onClick={continueLocalMode}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Continue in local mode
          </button>
        </div>
      </div>
    </div>
  );
}
