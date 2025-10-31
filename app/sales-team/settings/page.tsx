'use client';

import { Settings } from 'lucide-react';

export default function SalesTeamSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">設定</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理您的帳戶設定
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">設定</h3>
          <p className="text-gray-500">此功能即將推出</p>
        </div>
      </div>
    </div>
  );
}

