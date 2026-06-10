import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG } from '../config/api';
import { getBestApiEndpoint } from '../utils/apiHelper';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface PointsPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPointsPurchased?: (newBalance?: number) => void;
  onRefreshPoints?: () => Promise<void> | void;
  onReceiptSubmitted?: () => void;
}

interface PointsPlanOption {
  id: string;
  title: string;
  points: number;
  qrCodeUrl?: string;
}

const DEFAULT_POINT_PLANS: PointsPlanOption[] = [
  { id: 'plan-100', title: '100 點', points: 100 },
  { id: 'plan-500', title: '500 點', points: 500 },
  { id: 'plan-1000', title: '1000 點', points: 1000 },
  { id: 'plan-2000', title: '2000 點', points: 2000 },
  { id: 'plan-5000', title: '5000 點', points: 5000 },
];

const normalizePlans = (plans: any[]): PointsPlanOption[] => {
  return plans
    .map((plan: any, idx: number) => {
      if (!plan || plan.enabled === false) {
        return null;
      }
      const pointsValue = typeof plan.points === 'number' ? plan.points : Number(plan.points);
      if (!pointsValue || Number.isNaN(pointsValue)) {
        return null;
      }
      return {
        id: plan.id || `plan-${idx + 1}`,
        title:
          typeof plan.title === 'string' && plan.title.trim().length > 0
            ? plan.title.trim()
            : `${pointsValue} 點`,
        points: pointsValue,
        qrCodeUrl:
          typeof plan.qrCodeUrl === 'string' && plan.qrCodeUrl.trim().length > 0
            ? plan.qrCodeUrl
            : undefined,
      };
    })
    .filter(
      (plan: PointsPlanOption | null): plan is PointsPlanOption => plan !== null
    )
    .sort((a, b) => a.points - b.points);
};

const PointsPurchaseModal: React.FC<PointsPurchaseModalProps> = ({
  visible,
  onClose,
  onPointsPurchased,
  onRefreshPoints,
  onReceiptSubmitted
}) => {
  const { user, firebaseUser } = useAuth();
  const [pointPlans, setPointPlans] = useState<PointsPlanOption[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ name: string; number: string }>>([]);

  useEffect(() => {
    // Only fetch point plans if user is authenticated
    // Unauthenticated users will use default plans
    if (!firebaseUser) {
      setPointPlans(DEFAULT_POINT_PLANS);
      setPlansLoading(false);
      return;
    }

    const ref = doc(db, 'admin', 'pointsSettings');
    setPlansLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as any;
          if (Array.isArray(data.plans) && data.plans.length > 0) {
            const normalized = normalizePlans(data.plans);
            if (normalized.length > 0) {
              setPointPlans(normalized);
              setPlansLoading(false);
              return;
            }
          }
        }
        setPointPlans(DEFAULT_POINT_PLANS);
        setPlansLoading(false);
      },
      (error: any) => {
        // Handle permission errors gracefully - use default plans
        if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
          console.log('Point plans require authentication. Using default plans.');
        } else {
        console.error('Failed to load point plans (mobile):', error);
        }
        setPointPlans(DEFAULT_POINT_PLANS);
        setPlansLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [firebaseUser]);

  // Fetch payment methods from mobile-app page
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const pageDoc = await getDoc(doc(db, 'pages', 'mobile-app'));
        if (pageDoc.exists()) {
          const data = pageDoc.data();
          const areasData = data.areas || null;
          if (Array.isArray(areasData?.paymentMethods)) {
            setPaymentMethods(areasData.paymentMethods.filter((pm: any) => pm?.name && pm?.number));
          } else {
            setPaymentMethods([]);
          }
        } else {
          setPaymentMethods([]);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setPaymentMethods([]);
      }
    };
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      const exists = pointPlans.some(plan => plan.id === selectedPlanId);
      if (!exists) {
        setSelectedPlanId(null);
        setReceiptUrl('');
        setReceiptPreview('');
      }
    }
  }, [pointPlans, selectedPlanId]);

  useEffect(() => {
    if (!visible) {
      setSelectedPlanId(null);
      setReceiptUrl('');
      setReceiptPreview('');
      setUploadingReceipt(false);
      setRefreshingBalance(false);
    }
  }, [visible]);

  const selectedPlan = selectedPlanId
    ? pointPlans.find(plan => plan.id === selectedPlanId)
    : null;
  const planPoints = selectedPlan?.points ?? 0;

  const handleRefreshBalance = async () => {
    if (refreshingBalance) return;
    try {
      setRefreshingBalance(true);
      await onRefreshPoints?.();
    } catch (error) {
      console.error('Failed to refresh balance in modal:', error);
      Alert.alert('錯誤', '無法重新整理點數，請稍候再試');
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleSelectReceipt = async () => {
    if (!selectedPlanId) {
      Alert.alert('提示', '請先選擇點數方案');
      return;
    }
    if (!firebaseUser) {
      Alert.alert('提示', '請先登入以便上傳收據');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('權限不足', '請允許存取相簿以便上傳收據');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // Compress a bit more to keep upload size reasonable for mobile + API limits
      quality: 0.6,
      // Request base64 directly when possible to avoid blob conversions
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setUploadingReceipt(true);
    try {
      let base64 = asset.base64 || '';

      // Fallback to FileSystem for platforms that don't return base64
      if (!base64) {
        try {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (fsError) {
          console.error('Failed to read local file for receipt upload:', fsError);
          Alert.alert('錯誤', '無法讀取選擇的圖片，請重新選擇。');
          return;
        }
      }

      // Enforce a max upload size on the client to avoid HTTP 413 from the API
      // Base64 length ≈ 4/3 of byte size, so bytes ≈ (len * 3) / 4
      const estimatedBytes = Math.ceil((base64.length * 3) / 4);
      const maxBytes = 4 * 1024 * 1024; // 4MB
      if (estimatedBytes > maxBytes) {
        console.warn('Receipt image too large to upload', {
          estimatedBytes,
          maxBytes,
        });
        Alert.alert(
          '收據圖片過大',
          '收據圖片檔案太大，請截圖或壓縮後再上傳（建議小於 4MB）。'
        );
        return;
      }

      // Determine file metadata for server-side upload
      const originalExtension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
      const normalizedExtension = originalExtension === 'heic' ? 'jpg' : originalExtension || 'jpg';
      const contentType =
        (asset as any)?.mimeType ||
        (normalizedExtension === 'jpg' || normalizedExtension === 'jpeg'
          ? 'image/jpeg'
          : `image/${normalizedExtension}`);
      const fileName = `points_receipts_${firebaseUser.uid}_${Date.now()}.${normalizedExtension}`;

      // For receipt uploads we prefer to use the configured BASE_URL directly so
      // we don't accidentally fall back to a production domain that might not
      // yet have the /api/upload-receipt route deployed. This is especially
      // important during mobile development where some test endpoints may be
      // reachable but not fully updated.
      //
      // If needed in the future we can re-enable dynamic endpoint probing, but
      // for now we keep this simple and explicit.
      const baseEndpoint = API_CONFIG.BASE_URL;
      const uploadUrl = `${baseEndpoint}/api/upload-receipt`;
      
      console.log('[Receipt Upload] Starting upload...');
      console.log('[Receipt Upload] Base endpoint:', baseEndpoint);
      console.log('[Receipt Upload] Full URL:', uploadUrl);
      console.log('[Receipt Upload] __DEV__:', __DEV__);
      console.log('[Receipt Upload] File name:', fileName);
      console.log('[Receipt Upload] Base64 length:', base64?.length || 0);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64,
          contentType,
          fileName,
          userId: firebaseUser.uid,
          source: 'mobile-app',
        }),
      });

      console.log('[Receipt Upload] Response status:', response.status);
      console.log('[Receipt Upload] Response ok:', response.ok);
      console.log('[Receipt Upload] Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('[Receipt Upload] Response text (first 500 chars):', responseText.substring(0, 500));
      
      let data: any = {};
      try {
        data = JSON.parse(responseText);
        console.log('[Receipt Upload] Parsed JSON:', data);
      } catch (parseError) {
        console.error('[Receipt Upload] Failed to parse JSON response:', parseError);
        console.error('[Receipt Upload] Full response text:', responseText);
        throw new Error(`伺服器回應格式錯誤 (HTTP ${response.status})。請檢查網路連接或聯絡客服。`);
      }

      if (!response.ok || !data?.downloadUrl) {
        const errorMessage =
          data?.error ||
          data?.message ||
          `收據上傳失敗 (HTTP ${response.status}). 請稍後再試`;
        console.error('[Receipt Upload] Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: uploadUrl,
        });
        throw new Error(errorMessage);
      }

      setReceiptPreview(asset.uri);
      setReceiptUrl(data.downloadUrl);
      Alert.alert('成功', '收據已上傳');
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      setReceiptPreview('');
      setReceiptUrl('');
      Alert.alert('錯誤', '收據上傳失敗，請稍後再試');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptPreview('');
    setReceiptUrl('');
  };

  const handlePurchase = async () => {
    if (!firebaseUser || !user) {
      Alert.alert('錯誤', '請先登入');
      return;
    }

    if (!selectedPlan) {
      Alert.alert('錯誤', '請選擇要購買的點數方案');
      return;
    }
    if (uploadingReceipt) {
      Alert.alert('提示', '收據仍在上傳中，請稍候');
      return;
    }
    if (!receiptUrl) {
      Alert.alert('錯誤', '請先上傳轉帳收據');
      return;
    }
    const pointsToPurchase = selectedPlan.points;

    setIsProcessing(true);

    try {
      const baseEndpoint = await getBestApiEndpoint();
      const purchaseUrl = `${baseEndpoint}/api/purchase-points`;
      
      console.log('Purchasing points from:', purchaseUrl);
      console.log('Base endpoint:', baseEndpoint);
      console.log('Purchase data:', {
        userId: firebaseUser.uid,
        pointsToPurchase,
        paymentAmount: pointsToPurchase,
        receiptUrl,
        planId: selectedPlan.id,
      });
      
      // Verify endpoint exists first by checking if we can reach the test endpoint
      let serverReachable = false;
      try {
        const testResponse = await fetch(`${baseEndpoint}/api/test`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (testResponse.ok) {
          console.log('Test endpoint is accessible - server is running');
          serverReachable = true;
        } else {
          console.warn('Test endpoint check failed:', testResponse.status);
          const testContentType = testResponse.headers.get('content-type') || '';
          if (testContentType.includes('text/html')) {
            console.warn('Server returned HTML instead of JSON - server may not be running correctly');
          }
        }
      } catch (testError) {
        console.warn('Could not verify API connectivity:', testError);
        // This might mean the server isn't running at all
      }
      
      const response = await fetch(purchaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          pointsToPurchase,
          paymentAmount: pointsToPurchase, // 1 HKD = 1 point
          receiptUrl,
          planId: selectedPlan.id,
        }),
      });
      
      console.log('Purchase response status:', response.status);
      console.log('Purchase response headers:', Object.fromEntries(response.headers.entries()));

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const isHtml = contentType.includes('text/html') || contentType.includes('text/plain');

      let data: any = {};
      let responseText = '';
      
      try {
        responseText = await response.text();
        
        // If response is HTML (like a 404 page), don't try to parse as JSON
        if (isHtml || (!isJson && (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<')))) {
          console.error('Received HTML response instead of JSON');
          console.error('Response preview:', responseText.substring(0, 200));
          
          // Handle 404 specifically
          if (response.status === 404) {
            let errorMsg = `API 端點不存在 (404)。\n\n請確認：\n1. Next.js 伺服器是否正在運行（執行 yarn dev 或 npm run dev）\n2. API 路徑是否正確：${purchaseUrl}\n3. 網路連接是否正常`;
            
            if (!serverReachable) {
              errorMsg += '\n\n⚠️ 無法連接到伺服器，請確認伺服器是否正在運行。';
            } else {
              errorMsg += '\n\n⚠️ 伺服器可連接，但 API 路由不存在。請確認：\n- 路由檔案是否存在：app/api/purchase-points/route.ts\n- Next.js 是否需要重新啟動';
            }
            
            errorMsg += '\n\n如問題持續，請聯絡客服。';
            
            data = { 
              error: errorMsg,
              status: 404,
              url: purchaseUrl,
              serverReachable: serverReachable
            };
          } else {
            data = { 
              error: `伺服器回應錯誤 (HTTP ${response.status})。請稍後再試或聯絡客服。`,
              status: response.status 
            };
          }
        } else if (responseText) {
          // Try to parse as JSON
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            console.error('Response text:', responseText.substring(0, 200));
            data = { 
              error: '伺服器回應格式錯誤。請稍後再試或聯絡客服。',
              raw: responseText.substring(0, 100) // Keep first 100 chars for debugging
            };
          }
        }
      } catch (textError) {
        console.error('Failed to read response text:', textError);
        data = { error: '無法讀取伺服器回應。請檢查網路連接。' };
      }

      if (response.ok) {
        console.log('Points purchase successful:', data);
        if (data.pending) {
          Alert.alert('成功', '申請已送出，待客服審核後點數將入帳。');
          onReceiptSubmitted?.();
        } else {
          Alert.alert('成功', `成功購買 ${pointsToPurchase} 點！`);
          onPointsPurchased?.(data.newBalance);
        }
        await onRefreshPoints?.();
        onClose();
        // Reset form
        setSelectedPlanId(null);
        setReceiptPreview('');
        setReceiptUrl('');
      } else {
        console.error('Points purchase failed:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          isHtml: isHtml,
          url: purchaseUrl,
          baseEndpoint: baseEndpoint,
          data: data,
          responseTextPreview: responseText ? responseText.substring(0, 200) : 'empty',
          responseHeaders: Object.fromEntries(response.headers.entries())
        });
        
        // Extract user-friendly error message
        let errorMsg = '購買失敗，請稍後再試';
        
        if (data.error) {
          // Use the error from data (already user-friendly)
          errorMsg = data.error;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.details) {
          errorMsg = data.details;
        } else if (response.status === 404) {
          const urlInfo = data.url ? `\n\n嘗試的 URL: ${data.url}` : '';
          errorMsg = `API 端點不存在 (404)。${urlInfo}\n\n請確認伺服器是否正在運行，或聯絡客服。`;
        } else if (response.status === 500) {
          errorMsg = '伺服器錯誤。請稍後再試或聯絡客服。';
        } else if (response.status === 400) {
          errorMsg = '請求參數錯誤。請檢查輸入資料。';
        } else {
          errorMsg = `購買失敗 (HTTP ${response.status})。請稍後再試或聯絡客服。`;
        }
        
        Alert.alert('錯誤', errorMsg);
      }
    } catch (error) {
      console.error('Error purchasing points:', error);
      let errorMessage = '購買失敗，請稍後再試';
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = '網路連接失敗，請檢查網路設置';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = '無法連接到伺服器，請檢查網路連接';
        } else if (error.message.includes('timeout')) {
          errorMessage = '請求超時，請稍後再試';
        } else {
          errorMessage = `購買失敗: ${error.message}`;
        }
      }
      
      Alert.alert('錯誤', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="wallet-outline" size={24} color="#f59e0b" />
            <Text style={styles.headerTitle}>購買會員點數</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Balance */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>目前點數餘額</Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  refreshingBalance && { opacity: 0.5 },
                ]}
                onPress={handleRefreshBalance}
                disabled={refreshingBalance}
              >
                {refreshingBalance ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#3b82f6" />
                    <Text style={styles.refreshButtonText}>重新整理</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {user?.memberPoints?.toLocaleString?.() ?? user?.memberPoints ?? 0} 點
            </Text>
          </View>

          {/* Points Packages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>選擇點數套餐</Text>
            {plansLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={styles.loadingText}>點數方案載入中...</Text>
              </View>
            ) : pointPlans.length === 0 ? (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>目前沒有可用的點數方案。</Text>
              </View>
            ) : (
              <View style={styles.packagesGrid}>
                {pointPlans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.packageCard,
                      selectedPlanId === plan.id && styles.selectedPackage
                    ]}
                    onPress={() => {
                      setSelectedPlanId(plan.id);
                      setReceiptPreview('');
                      setReceiptUrl('');
                    }}
                  >
                    <Text style={styles.packageLabel}>{plan.title}</Text>
                    <Text style={styles.packageDescription}>{plan.points} 點</Text>
                    <Text style={styles.packagePrice}>HKD ${plan.points}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            </View>

          {selectedPlan && (
            <View style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <Ionicons name="qr-code-outline" size={20} color="#1f2937" />
                <Text style={styles.qrTitle}>掃描 QR Code 轉帳</Text>
              </View>
              <Text style={styles.qrDescription}>
                使用手機銀行或支付應用掃描 QR Code，完成 HKD ${planPoints.toLocaleString()} 的轉帳，並保留收據。
              </Text>
              {selectedPlan.qrCodeUrl ? (
                <Image
                  source={{ uri: selectedPlan.qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderText}>此方案尚未提供 QR Code</Text>
                </View>
              )}
              <Text style={styles.qrHint}>完成轉帳後，請上傳轉帳收據以便客服審核。</Text>
            </View>
          )}

          {/* Payment Methods Section */}
          {paymentMethods.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>付款方式</Text>
              <View style={styles.paymentMethodsCard}>
                <Text style={styles.paymentMethodsTitle}>銀行轉帳資料</Text>
                <View style={styles.paymentMethodsContent}>
                  {paymentMethods.map((method, index) => (
                    <View key={index} style={styles.paymentMethodItem}>
                      <Text style={styles.paymentMethodName}>{method.name}:</Text>
                      <Text style={styles.paymentMethodNumber}>{method.number}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.paymentMethodsNote}>請轉帳後上傳收據以便核對</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>上傳轉帳收據</Text>
            <Text style={styles.uploadHint}>轉帳完成後，請上傳清晰的收據圖片，客服將據此進行審核。</Text>
            {receiptPreview ? (
              <View style={styles.receiptPreviewCard}>
                <Image source={{ uri: receiptPreview }} style={styles.receiptImage} resizeMode="cover" />
                <View style={styles.receiptButtons}>
                  <TouchableOpacity
                    style={styles.receiptActionButton}
                    onPress={handleSelectReceipt}
                    disabled={uploadingReceipt}
                  >
                    <Ionicons name="cloud-upload-outline" size={18} color="#2563eb" />
                    <Text style={styles.receiptActionButtonText}>重新上傳</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeReceiptButton}
                    onPress={handleRemoveReceipt}
                    disabled={uploadingReceipt}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.removeReceiptButtonText}>移除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
          <TouchableOpacity
                style={[
                  styles.uploadButton,
                  (!selectedPlanId || uploadingReceipt) && styles.uploadButtonDisabled
                ]}
                onPress={handleSelectReceipt}
                disabled={!selectedPlanId || uploadingReceipt}
              >
                {uploadingReceipt ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>上傳轉帳收據</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <Text style={styles.uploadNote}>
              支援 JPG、PNG 等常見圖片格式，檔案需清晰可辨。若無法上傳，請洽客服協助。
            </Text>
          </View>

          {/* Purchase Summary */}
          {selectedPlan && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>購買摘要</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>點數：</Text>
                <Text style={styles.summaryValue}>
                  {planPoints.toLocaleString()} 點
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>金額：</Text>
                <Text style={styles.summaryValue}>
                  HKD ${planPoints.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>總計：</Text>
                <Text style={styles.summaryTotalValue}>
                  HKD ${planPoints.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Terms */}
          <View style={styles.termsCard}>
            <Text style={styles.termsText}>• 1 港元 = 1 點</Text>
            <Text style={styles.termsText}>• 申請送出後由客服審核，審核通過後點數將入帳</Text>
            <Text style={styles.termsText}>• 如需協助，請聯絡客服人員</Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (!selectedPlan || !receiptUrl || uploadingReceipt) && styles.disabledButton
            ]}
            onPress={handlePurchase}
            disabled={
              isProcessing || !selectedPlan || !receiptUrl || uploadingReceipt
            }
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.purchaseButtonText}>立即購買</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e6efff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packageCard: {
    width: '47%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedPackage: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  packageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  qrCard: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#f9fafb',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  qrDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  qrImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qrPlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  qrHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
  },
  uploadHint: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  uploadNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
  },
  receiptPreviewCard: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  receiptImage: {
    width: '100%',
    height: 220,
  },
  receiptButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  receiptActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  receiptActionButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  removeReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  removeReceiptButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  loadingCard: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  termsCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  purchaseButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  paymentMethodsCard: {
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  paymentMethodsContent: {
    marginBottom: 12,
  },
  paymentMethodItem: {
    marginBottom: 8,
  },
  paymentMethodName: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 2,
  },
  paymentMethodNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  paymentMethodsNote: {
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 8,
  },
});

export default PointsPurchaseModal;
