'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  X,
  History,
  Edit
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier: string;
  lastUpdated: string;
  status: 'low' | 'normal' | 'high' | 'out';
}

interface InventoryHistory {
  date: string;
  action: string;
  quantity: number;
  previous: number;
  user: string;
  itemId: string;
  itemName: string;
}

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [historyData, setHistoryData] = useState<InventoryHistory[]>([]);

  // Fetch products from Firestore and convert to inventory items
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        const inventoryItems: InventoryItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const currentStock = data.stockQuantity || 0;
          const minStock = data.minOrderQuantity * 10 || 10; // Set min stock as 10x min order
          const maxStock = minStock * 20 || 200; // Set max stock as 20x min stock
          
          // Calculate status
          let status: 'low' | 'normal' | 'high' | 'out' = 'normal';
          if (currentStock === 0) {
            status = 'out';
          } else if (currentStock <= minStock) {
            status = 'low';
          } else if (currentStock >= maxStock * 0.8) {
            status = 'high';
          }
          
          return {
            id: doc.id,
            name: data.name || '',
            category: data.category || '',
            currentStock: currentStock,
            minStock: minStock,
            maxStock: maxStock,
            unit: data.unit || '個',
            supplier: data.supplier || '未指定',
            lastUpdated: data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            status: status,
          };
        });
        
        setInventory(inventoryItems);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(searchLower) ||
      item.id.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      case 'out':
        return 'text-red-600 bg-red-100';
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'high':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'low':
        return '庫存不足';
      case 'out':
        return '缺貨';
      case 'normal':
        return '正常';
      case 'high':
        return '庫存充足';
      default:
        return '未知';
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const handleUpdateStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewStockValue(item.currentStock.toString());
    setShowUpdateModal(true);
  };

  const handleSaveStockUpdate = async () => {
    if (selectedItem && newStockValue) {
      const newStock = parseInt(newStockValue);
      if (!isNaN(newStock) && newStock >= 0) {
        try {
          // Update product stock in Firestore
          const productRef = doc(db, 'products', selectedItem.id);
          await updateDoc(productRef, {
            stockQuantity: newStock,
            updatedAt: serverTimestamp()
          });

          // Calculate new status
          const newStatus: 'low' | 'normal' | 'high' | 'out' = newStock === 0 ? 'out' : 
                           newStock <= selectedItem.minStock ? 'low' : 
                           newStock >= selectedItem.maxStock * 0.8 ? 'high' : 'normal';

          // Save to inventory history
          await addDoc(collection(db, 'inventory_history'), {
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            action: '庫存更新',
            previousQuantity: selectedItem.currentStock,
            newQuantity: newStock,
            user: '管理員',
            createdAt: serverTimestamp()
          });

          // Update local state
          const updatedInventory = inventory.map(item => 
            item.id === selectedItem.id 
              ? { 
                  ...item, 
                  currentStock: newStock,
                  lastUpdated: new Date().toISOString().split('T')[0],
                  status: newStatus
                }
              : item
          );
          setInventory(updatedInventory);
          setShowUpdateModal(false);
          setSelectedItem(null);
          setNewStockValue('');
        } catch (error) {
          console.error('Error updating stock:', error);
          alert('更新庫存失敗');
        }
      }
    }
  };

  // Fetch history data when modal opens
  const handleViewHistory = async (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
    
    try {
      const historyRef = collection(db, 'inventory_history');
      const q = query(
        historyRef,
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      
      const history: InventoryHistory[] = snapshot.docs
        .filter(doc => doc.data().itemId === item.id)
        .map(doc => {
          const data = doc.data();
          return {
            date: data.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            action: data.action || '庫存更新',
            quantity: data.newQuantity || 0,
            previous: data.previousQuantity || 0,
            user: data.user || '管理員',
            itemId: data.itemId,
            itemName: data.itemName
          };
        });
      
      setHistoryData(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryData([]);
    }
  };

  // Calculate statistics
  const stats = {
    lowStock: inventory.filter(item => item.status === 'low').length,
    outOfStock: inventory.filter(item => item.status === 'out').length,
    totalItems: inventory.length,
    avgStockLevel: inventory.length > 0 
      ? Math.round(inventory.reduce((sum, item) => sum + getStockPercentage(item.currentStock, item.maxStock), 0) / inventory.length)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">庫存管理</h1>
            <p className="text-gray-600">追蹤庫存水平並管理庫存</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">庫存不足項目</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">缺貨項目</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">總項目數</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均庫存水平</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgStockLevel}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋庫存</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="按名稱或ID搜尋..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">狀態篩選</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">所有狀態</option>
              <option value="low">庫存不足</option>
              <option value="out">缺貨</option>
              <option value="normal">正常</option>
              <option value="high">庫存充足</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full btn-primary py-3">
              <Filter className="w-4 h-4 mr-2" />
              套用篩選
            </button>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              庫存 ({filteredInventory.length})
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>最後更新：{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  項目
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  類別
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  庫存水平
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最後更新
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">ID: {item.id}</div>
                    <div className="text-sm text-gray-500">{item.supplier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.category}</div>
                    <div className="text-sm text-gray-500">單位: {item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.currentStock} {item.unit}</div>
                    <div className="text-sm text-gray-500">最小: {item.minStock} | 最大: {item.maxStock}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleUpdateStock(item)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                      >
                        更新庫存
                      </button>
                      <button 
                        onClick={() => handleViewHistory(item)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                      >
                        查看歷史
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">未找到庫存項目</h3>
          <p className="text-gray-600">
            請調整搜尋條件或篩選器來找到您要找的內容。
          </p>
        </div>
      )}

      {/* Update Stock Modal */}
      {showUpdateModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">更新庫存</h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">項目: {selectedItem.name}</p>
                <p className="text-sm text-gray-600 mb-4">當前庫存: {selectedItem.currentStock} {selectedItem.unit}</p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新庫存水平 ({selectedItem.unit})
                </label>
                <input
                  type="number"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveStockUpdate}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  儲存變更
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View History Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">庫存歷史 - {selectedItem.name}</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">項目ID: {selectedItem.id}</p>
                <p className="text-sm text-gray-600">當前庫存: {selectedItem.currentStock} {selectedItem.unit}</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        先前庫存
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        新庫存
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        變更
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        更新者
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                          無歷史記錄
                        </td>
                      </tr>
                    ) : (
                      historyData.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.previous} {selectedItem.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.quantity} {selectedItem.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              entry.quantity > entry.previous ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.quantity > entry.previous ? '+' : ''}{entry.quantity - entry.previous} {selectedItem.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.user}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 