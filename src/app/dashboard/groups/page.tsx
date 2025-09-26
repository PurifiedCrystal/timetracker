'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GroupsPage() {
  const router = useRouter();

  return (
    <div className="pb-20 max-w-md mx-auto lg:max-w-4xl lg:px-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Groups</h1>
        <p className="text-gray-600">Groups feature is being set up...</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Groups Coming Soon!</h2>
          <p className="text-gray-600 mb-4">
            The groups feature is being prepared and will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}