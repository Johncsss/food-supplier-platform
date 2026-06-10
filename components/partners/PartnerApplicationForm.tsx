import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadDocument } from '@/lib/image-upload';

interface PartnerApplicationFormProps {
  onSubmitted?: () => void;
  className?: string;
}

export default function PartnerApplicationForm({ onSubmitted, className }: PartnerApplicationFormProps) {
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const hasAcceptedTerms = form.termsAgreement?.checked;
    const hasAcceptedPrivacy = form.privacyAgreement?.checked;

    if (!hasAcceptedTerms || !hasAcceptedPrivacy) {
      window.alert('請先閱讀並勾選同意隱私政策與服務條款。');
      return;
    }

    const formData = new FormData(form);
    const businessRegistrationFile = formData.get('businessRegistrationFile') as File | null;

    // Upload business registration file if provided
    let businessRegistrationFileUrl = '';
    if (businessRegistrationFile && businessRegistrationFile.size > 0) {
      try {
        const uploadResult = await uploadDocument(businessRegistrationFile, 'business_registrations');
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || '商業登記證上傳失敗');
        }
        businessRegistrationFileUrl = uploadResult.url;
      } catch (error: any) {
        window.alert(error?.message || '商業登記證上傳失敗，請稍後再試。');
        return;
      }
    }

    const payload = {
      companyNameEn: (formData.get('companyNameEn') || '').toString().trim(),
      companyNameZh: (formData.get('companyNameZh') || '').toString().trim(),
      companyAddressEn: (formData.get('companyAddressEn') || '').toString().trim(),
      companyAddressZh: (formData.get('companyAddressZh') || '').toString().trim(),
      shopNameEn: (formData.get('shopNameEn') || '').toString().trim(),
      shopNameZh: (formData.get('shopNameZh') || '').toString().trim(),
      shopAddressEn: (formData.get('shopAddressEn') || '').toString().trim(),
      shopAddressZh: (formData.get('shopAddressZh') || '').toString().trim(),
      contactName: (formData.get('contactName') || '').toString().trim(),
      contactTitle: (formData.get('contactTitle') || '').toString().trim(),
      contactPhone: (formData.get('contactPhone') || '').toString().trim(),
      contactFax: (formData.get('contactFax') || '').toString().trim(),
      contactEmail: (formData.get('contactEmail') || '').toString().trim(),
      accountingName: (formData.get('accountingName') || '').toString().trim(),
      accountingTitle: (formData.get('accountingTitle') || '').toString().trim(),
      accountingPhone: (formData.get('accountingPhone') || '').toString().trim(),
      accountingFax: (formData.get('accountingFax') || '').toString().trim(),
      accountingEmail: (formData.get('accountingEmail') || '').toString().trim(),
      businessRegNumber: (formData.get('businessRegNumber') || '').toString().trim(),
      businessNature: (formData.get('businessNature') || '').toString().trim(),
      propertyStatus: (formData.get('propertyStatus') || '').toString().trim(),
      staffName: (formData.get('staffName') || '').toString().trim(),
      businessRegistrationFileUrl: businessRegistrationFileUrl,
      membershipStatus: 'inactive',
      password: `Temp!${Math.random().toString(36).slice(2, 10)}`,
    };

    try {
      const response = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '提交申請失敗，請稍後再試。');
      }

      form.reset();
      if (onSubmitted) {
        onSubmitted();
      }
      router.push('/partners/apply/thank-you');
    } catch (error: any) {
      console.error('Error submitting partner application:', error);
      window.alert(error?.message || '提交申請失敗，請稍後再試。');
    }
  };

  return (
    <form className={className ?? 'space-y-8'} onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">公司資料 Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱（英文）*</label>
              <input
                type="text"
                required
                name="companyNameEn"
                placeholder="Company Name (English)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱（中文）</label>
              <input
                type="text"
                name="companyNameZh"
                placeholder="公司名稱"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">公司地址（英文）*</label>
              <input
                type="text"
                required
                name="companyAddressEn"
                placeholder="Company Address (English)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">公司地址（中文）</label>
              <input
                type="text"
                name="companyAddressZh"
                placeholder="公司地址"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">店舖資料 Shop Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">店舖名稱（英文）*</label>
              <input
                type="text"
                required
                name="shopNameEn"
                placeholder="Shop Name (English)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">店舖名稱（中文）</label>
              <input
                type="text"
                name="shopNameZh"
                placeholder="店舖名稱"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">店舖地址（英文）*</label>
              <input
                type="text"
                required
                name="shopAddressEn"
                placeholder="Shop Address (English)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">店舖地址（中文）</label>
              <input
                type="text"
                name="shopAddressZh"
                placeholder="店舖地址"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">聯絡人 Contact Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">聯絡人姓名 *</label>
              <input
                type="text"
                required
                name="contactName"
                placeholder="Contact Person"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">職銜 Title *</label>
              <input
                type="text"
                required
                name="contactTitle"
                placeholder="Title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼 *</label>
              <input
                type="tel"
                required
                name="contactPhone"
                placeholder="Telephone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">傳真號碼</label>
              <input
                type="text"
                name="contactFax"
                placeholder="Fax"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">電郵地址 *</label>
              <input
                type="email"
                required
                name="contactEmail"
                placeholder="Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">會計部聯絡人 Accounting Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">聯絡人姓名</label>
              <input
                type="text"
                name="accountingName"
                placeholder="Accounting Contact Person"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">職銜 Title</label>
              <input
                type="text"
                name="accountingTitle"
                placeholder="Title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼</label>
              <input
                type="tel"
                name="accountingPhone"
                placeholder="A/C Telephone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">傳真號碼</label>
              <input
                type="text"
                name="accountingFax"
                placeholder="A/C Fax"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">電郵地址</label>
              <input
                type="email"
                name="accountingEmail"
                placeholder="A/C Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">營運及授信資料 Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">商業登記證號碼 *</label>
              <input
                type="text"
                required
                name="businessRegNumber"
                placeholder="Business Registration No."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">上傳商業登記證副本</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                name="businessRegistrationFile"
                required
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#0B8628] hover:file:bg-green-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">業務性質 *</label>
              <input
                type="text"
                required
                name="businessNature"
                placeholder="Nature of Business"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">該鋪自置或租用 *</label>
              <select
                required
                name="propertyStatus"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              >
                <option value="">請選擇</option>
                <option value="owned">自置 Owned</option>
                <option value="rented">租用 Rented</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">平台跟進專員</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">工作人員名稱 *</label>
              <input
                type="text"
                required
                name="staffName"
                placeholder="請輸入工作人員名稱"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B8628]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 pt-4">
        <div className="space-y-3">
          <label className="flex items-start space-x-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="privacyAgreement"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0B8628] focus:ring-[#0B8628]"
              required
            />
            <span>
              我已閱讀並同意{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0B8628] underline">
                隱私政策 Privacy Policy
              </a>
              。
            </span>
          </label>
          <label className="flex items-start space-x-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="termsAgreement"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0B8628] focus:ring-[#0B8628]"
              required
            />
            <span>
              我已閱讀並同意{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#0B8628] underline">
                服務條款 Terms of Service
              </a>
              。
            </span>
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center px-8 py-3 bg-[#0B8628] text-white text-base font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          送出申請
        </button>
      </div>
    </form>
  );
}
