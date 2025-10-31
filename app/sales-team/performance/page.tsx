'use client';

import { TrendingUp } from 'lucide-react';

export default function SalesTeamPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">業績統計</h1>
        <p className="mt-1 text-sm text-gray-500">
          查看您的業績數據和統計
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">業績統計</h3>
          <p className="text-gray-500">此功能即將推出</p>
        </div>
      </div>
    </div>
  );
}

