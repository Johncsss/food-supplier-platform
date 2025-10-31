'use client';

import { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ComplaintModalProps {
  orderId: string;
  supplierId: string;
  supplierCompanyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
}

export default function ComplaintModal({
  orderId,
  supplierId,
  supplierCompanyName,
  isOpen,
  onClose,
  onSubmit
}: ComplaintModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('請輸入投訴內容');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(message);
      setMessage('');
      onClose();
      toast.success('投訴已提交');
    } catch (error) {
      toast.error('提交投訴時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">提交投訴</h2>
              <p className="text-sm text-gray-600">訂單編號：{orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">投訴對象</h3>
            <p className="text-sm text-blue-800">{supplierCompanyName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="complaint-message" className="block text-sm font-medium text-gray-700 mb-2">
                投訴內容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="complaint-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="請詳細描述您的問題或投訴內容，例如：商品品質問題、配送延遲、服務態度等..."
                disabled={isSubmitting}
              />
              <p className="mt-2 text-sm text-gray-500">
                建議提供具體的問題描述，以便供應商快速處理您的投訴
              </p>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>提交投訴</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
