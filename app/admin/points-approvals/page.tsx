'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

interface PurchaseRequest {
  id: string;
  userId: string;
  userEmail?: string;
  restaurantName?: string;
  pointsRequested: number;
  paymentAmount: number;
  receiptUrl: string;
  planId?: string | null;
  status: string;
  createdAt?: any;
  adminNote?: string;
  approvedAt?: any;
  approvedBy?: string;
}

const formatDate = (value: any) => {
  if (!value) return '-';
  try {
    if (value.toDate) {
      return value.toDate().toLocaleString('zh-TW', { hour12: false });
    }
    if (typeof value === 'object' && value._seconds) {
      return new Date(value._seconds * 1000).toLocaleString('zh-TW', { hour12: false });
    }
    return new Date(value).toLocaleString('zh-TW', { hour12: false });
  } catch {
    return '-';
  }
};

export default function PointsApprovalsPage() {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PurchaseRequest[]>([]);
  const [historyRequests, setHistoryRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/points-purchase-requests');
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingRequests(data.pending || []);
        setHistoryRequests(data.history || []);
      } else {
        toast.error(data.error || '無法載入申請列表');
      }
    } catch (error) {
      console.error('Failed to load requests', error);
      toast.error('無法載入申請列表');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/points-purchase-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminEmail: user?.email || 'admin' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(action === 'approve' ? '已審核通過並發放點數' : '已拒絕該申請');
        await fetchRequests();
      } else {
        toast.error(data.error || '操作失敗');
      }
    } catch (error) {
      console.error('Failed to process request', error);
      toast.error('操作失敗');
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">已通過</span>;
      case 'rejected':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">已拒絕</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">處理中</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">點數審核</h1>
        <p className="text-gray-600">審核會員的點數購買申請，確認收據後再核發點數。</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">待審核申請</h2>
          <button
            onClick={fetchRequests}
            className="text-sm text-primary-600 hover:text-primary-700"
            disabled={loading}
          >
            重新整理
          </button>
        </div>
        {loading ? (
          <div className="py-16 text-center text-gray-500">載入中...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="py-16 text-center text-gray-500">目前沒有待審核的申請</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">申請時間</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">餐廳名稱</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">點數</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">收據</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(request.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{request.restaurantName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{request.userEmail || '-'}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{request.pointsRequested}</td>
                    <td className="px-4 py-3">
                      {request.receiptUrl ? (
                        <a
                          href={request.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          查看收據
                        </a>
                      ) : (
                        <span className="text-gray-400">無</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={processingId === request.id}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingId === request.id ? '處理中...' : '審核通過'}
                        </button>
                        <button
                          onClick={() => handleAction(request.id, 'reject')}
                          disabled={processingId === request.id}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
                        >
                          拒絕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">審核歷史紀錄</h2>
        {loading ? (
          <div className="py-16 text-center text-gray-500">載入中...</div>
        ) : historyRequests.length === 0 ? (
          <div className="py-16 text-center text-gray-500">目前沒有審核紀錄</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">審核時間</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">餐廳名稱</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">點數</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">審核結果</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">收據</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historyRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(request.approvedAt || request.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{request.restaurantName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{request.userEmail || '-'}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{request.pointsRequested}</td>
                    <td className="px-4 py-3">{renderStatus(request.status)}</td>
                    <td className="px-4 py-3">
                      {request.receiptUrl ? (
                        <a
                          href={request.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          查看收據
                        </a>
                      ) : (
                        <span className="text-gray-400">無</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

