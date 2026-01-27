import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Product, Sale, AdminTab } from '../types';
import { NeoButton, NeoCard, NeoInput, NeoModal, NeoBadge, NeoLoader } from '../components/NeoUI';
import { RechartsWrapper } from '../components/RechartsWrapper'; 

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // Data State
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.OVERVIEW);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Authentication ---
  const handlePinClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
         // Auto submit
         setTimeout(() => checkPin(newPin), 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const checkPin = (inputPin: string) => {
    if (inputPin === '1234') { 
      setIsAuthenticated(true);
      // Trigger fetch immediately
    } else {
      // Shake animation effect could go here
      alert('PIN မှားယွင်းနေပါသည် (Wrong PIN)');
      setPin('');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let start = new Date();
      start.setHours(0,0,0,0);
      
      if (dateFilter === 'week') start.setDate(now.getDate() - 7);
      if (dateFilter === 'month') start.setMonth(now.getMonth() - 1);
      if (dateFilter === 'all') start = new Date(0); 

      const [salesData, productsData] = await Promise.all([
        db.getSales(start, now),
        db.getProducts()
      ]);

      setSales(salesData);
      setProducts(productsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [dateFilter, isAuthenticated]);

  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
    // cash_amount and kpay_amount are now NET amounts
    const cashTotal = sales.reduce((acc, s) => acc + s.cash_amount, 0);
    const kpayTotal = sales.reduce((acc, s) => acc + s.kpay_amount, 0);
    return { totalSales, totalProfit, cashTotal, kpayTotal };
  }, [sales]);

  const handleSaveProduct = async () => {
    if (!editProduct.name || !editProduct.sell_price) return;
    setLoading(true);
    try {
      let imageUrl = editProduct.image_url;
      if (imageFile) {
        imageUrl = await db.uploadImage(imageFile);
      }
      
      await db.upsertProduct({
        ...editProduct,
        image_url: imageUrl
      });
      
      setProductModalOpen(false);
      setEditProduct({});
      setImageFile(null);
      fetchData();
    } catch (e) {
      alert('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await db.deleteProduct(id);
      fetchData();
    }
  };

  const getPaymentBadgeColor = (type: string) => {
    if (type === 'KPAY') return 'bg-blue-200';
    if (type === 'CASH') return 'bg-green-200';
    if (type === 'CASH_WITH_KPAY_CHANGE') return 'bg-purple-200';
    return 'bg-yellow-200'; // MIXED
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDF4F5] p-4">
        <NeoCard className="w-full max-w-sm text-center space-y-6 bg-white animate-in zoom-in duration-300">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-black">ADMIN ACCESS</h1>
            <p className="text-gray-500 font-bold">PIN နံပါတ်ရိုက်ထည့်ပါ</p>
          </div>
          
          {/* PIN Display */}
          <div className="flex justify-center gap-4 mb-4">
             {[0, 1, 2, 3].map(i => (
               <div key={i} className={`w-4 h-4 rounded-full border-2 border-black transition-colors ${pin.length > i ? 'bg-black' : 'bg-transparent'}`} />
             ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num}
                onClick={() => handlePinClick(num.toString())}
                className="h-16 w-16 text-2xl font-bold bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] hover:bg-gray-50 transition-all text-black"
              >
                {num}
              </button>
            ))}
            <div className="w-16"></div>
            <button 
              onClick={() => handlePinClick('0')}
              className="h-16 w-16 text-2xl font-bold bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] hover:bg-gray-50 transition-all text-black"
            >
              0
            </button>
            <button 
              onClick={handleBackspace}
              className="h-16 w-16 flex items-center justify-center text-xl font-bold bg-[#FF8888] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] text-black"
            >
              ⌫
            </button>
          </div>

          <NeoButton variant="ghost" onClick={() => navigate('/')} className="mt-4">Back to Cashier</NeoButton>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#FDF4F5]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Padauk'] text-black">စီမံခန့်ခွဲမှု (Admin)</h1>
          <p className="text-gray-600">ဆိုင်၏ အရောင်းစာရင်းနှင့် ပစ္စည်းစာရင်းများ</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border-2 border-black">
          {(['today', 'week', 'month', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-4 py-1 rounded md:text-sm text-xs font-bold transition-all text-black ${dateFilter === f ? 'bg-[#FFADE7] border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'hover:bg-gray-100'}`}
            >
              {f === 'today' ? 'ဒီနေ့' : f === 'week' ? 'ဒီအပတ်' : f === 'month' ? 'ဒီလ' : 'အားလုံး'}
            </button>
          ))}
        </div>
        <NeoButton variant="secondary" onClick={() => navigate('/')}>Exit</NeoButton>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-4">
        {[
            { id: AdminTab.OVERVIEW, label: 'အကျဉ်းချုပ် (Overview)', color: 'bg-[#FFADE7]' },
            { id: AdminTab.SALES, label: 'အရောင်းစာရင်း (Sales)', color: 'bg-[#A2D2FF]' },
            { id: AdminTab.PRODUCTS, label: 'ပစ္စည်းများ (Products)', color: 'bg-[#FFEF96]' },
            { id: AdminTab.PAYMENTS, label: 'ငွေစာရင်း (Payments)', color: 'bg-[#B0F2B4]' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 border-black font-bold transition-all text-black ${activeTab === tab.id ? `${tab.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1` : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {loading ? <NeoLoader /> : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === AdminTab.OVERVIEW && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <NeoCard color="bg-[#FFADE7]">
                     <p className="font-bold mb-2">စုစုပေါင်းရောင်းအား</p>
                     <h2 className="text-3xl font-black">{stats.totalSales.toLocaleString()} Ks</h2>
                  </NeoCard>
                  <NeoCard color="bg-[#A2D2FF]">
                     <p className="font-bold mb-2">စုစုပေါင်းအမြတ်</p>
                     <h2 className="text-3xl font-black text-blue-900">{stats.totalProfit.toLocaleString()} Ks</h2>
                  </NeoCard>
                  <NeoCard color="bg-[#B0F2B4]">
                     <p className="font-bold mb-2">Net Cash Drawer</p>
                     <h2 className="text-3xl font-black text-green-900">{stats.cashTotal.toLocaleString()} Ks</h2>
                     <p className="text-xs mt-1 text-gray-600 font-bold">Includes cash payments & refunds</p>
                  </NeoCard>
                  <NeoCard color="bg-[#FFEF96]">
                     <p className="font-bold mb-2">Net KPay Balance</p>
                     <h2 className={`text-3xl font-black ${stats.kpayTotal < 0 ? 'text-red-600' : 'text-orange-900'}`}>{stats.kpayTotal.toLocaleString()} Ks</h2>
                     <p className="text-xs mt-1 text-gray-600 font-bold">Includes KPay in & KPay change out</p>
                  </NeoCard>
                  
                  <div className="col-span-full md:col-span-2 mt-4">
                    <NeoCard className="min-h-[300px] flex items-center justify-center text-gray-400 font-bold bg-white">
                        <RechartsWrapper data={sales} />
                    </NeoCard>
                  </div>
               </div>
            )}

            {/* SALES TAB */}
            {(activeTab === AdminTab.SALES || activeTab === AdminTab.PAYMENTS) && (
               <NeoCard className="overflow-hidden p-0" color="bg-white">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 border-b-2 border-black text-black">
                        <tr>
                          <th className="p-4">Time</th>
                          <th className="p-4">Total</th>
                          <th className="p-4">Payment</th>
                          <th className="p-4">Net Cash</th>
                          <th className="p-4">Net KPay</th>
                          <th className="p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-black">
                        {sales.map(sale => (
                          <tr key={sale.id} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
                            <td className="p-4 font-mono text-sm">{new Date(sale.created_at).toLocaleString()}</td>
                            <td className="p-4 font-bold">{sale.total.toLocaleString()}</td>
                            <td className="p-4">
                              <NeoBadge color={getPaymentBadgeColor(sale.payment_type)}>
                                 {sale.payment_type.replace(/_/g, ' ')}
                              </NeoBadge>
                            </td>
                            <td className="p-4 font-mono text-sm">
                               {sale.cash_amount > 0 ? `+${sale.cash_amount.toLocaleString()}` : sale.cash_amount === 0 ? '-' : sale.cash_amount.toLocaleString()}
                            </td>
                            <td className="p-4 font-mono text-sm">
                               {sale.kpay_amount > 0 ? `+${sale.kpay_amount.toLocaleString()}` : sale.kpay_amount === 0 ? '-' : sale.kpay_amount.toLocaleString()}
                            </td>
                            <td className="p-4">
                               <button onClick={() => setSelectedSale(sale)} className="text-sm underline decoration-2 decoration-purple-500 font-bold">View</button>
                            </td>
                          </tr>
                        ))}
                        {sales.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-gray-400">အရောင်းမှတ်တမ်းမရှိပါ</td></tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               </NeoCard>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === AdminTab.PRODUCTS && (
              <div className="space-y-4">
                <div className="flex justify-end">
                   <NeoButton onClick={() => { setEditProduct({}); setProductModalOpen(true); }}>
                      + New Product
                   </NeoButton>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {products.map(p => (
                      <NeoCard key={p.id} className="flex gap-4 items-center" color="bg-white">
                         <div className="w-16 h-16 bg-gray-100 rounded border border-black overflow-hidden flex-shrink-0">
                           {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover"/>}
                         </div>
                         <div className="flex-1">
                            <h3 className="font-bold text-lg">{p.name}</h3>
                            <div className="text-sm text-gray-600">
                               Buy: {p.buy_price} | Sell: {p.sell_price} | Stock: {p.stock}
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => { setEditProduct(p); setProductModalOpen(true); }} className="p-2 hover:bg-blue-100 rounded text-blue-600 font-bold">Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 hover:bg-red-100 rounded text-red-600 font-bold">Del</button>
                         </div>
                      </NeoCard>
                   ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sale Detail Modal */}
      <NeoModal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title="အရောင်းအသေးစိတ် (Sale Details)">
        {selectedSale && (
           <div className="space-y-4 text-black">
              <div className="flex justify-between font-bold text-xl border-b-2 border-black pb-2">
                <span>Total Bill</span>
                <span>{selectedSale.total.toLocaleString()} Ks</span>
              </div>
              
              {/* Payment Info */}
              <div className="bg-gray-50 p-3 rounded border border-black">
                <p className="font-bold text-sm mb-2 uppercase text-gray-500">Payment Received (လက်ခံငွေ)</p>
                <div className="flex justify-between mb-1">
                   <span>💵 Cash In:</span>
                   <span className="font-mono font-bold">{selectedSale.cash_received?.toLocaleString() || 0} Ks</span>
                </div>
                <div className="flex justify-between">
                   <span>📱 KPay In:</span>
                   <span className="font-mono font-bold">{selectedSale.kpay_received?.toLocaleString() || 0} Ks</span>
                </div>
              </div>

              {/* Change Info */}
              {(selectedSale.change_amount || 0) > 0 && (
                <div className="bg-yellow-50 p-3 rounded border border-black">
                  <p className="font-bold text-sm mb-2 uppercase text-yellow-800">Change Returned (ပြန်အမ်းငွေ)</p>
                  <div className="flex justify-between mb-1 text-red-600 font-bold">
                     <span>Total Change:</span>
                     <span>-{selectedSale.change_amount?.toLocaleString()} Ks</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                     <span>Returned Via:</span>
                     <NeoBadge color={selectedSale.change_method === 'KPAY' ? 'bg-[#A2D2FF]' : 'bg-[#B0F2B4]'}>
                        {selectedSale.change_method || 'CASH'}
                     </NeoBadge>
                  </div>
                </div>
              )}

              {/* Net Impact */}
              <div className="bg-blue-50 p-3 rounded border border-black">
                 <p className="font-bold text-sm mb-2 uppercase text-blue-800">Net Balance Impact</p>
                 <div className="flex justify-between mb-1">
                    <span>Cash Drawer:</span>
                    <span className={`font-mono font-bold ${selectedSale.cash_amount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {selectedSale.cash_amount > 0 ? '+' : ''}{selectedSale.cash_amount.toLocaleString()} Ks
                    </span>
                 </div>
                 <div className="flex justify-between">
                    <span>KPay Balance:</span>
                    <span className={`font-mono font-bold ${selectedSale.kpay_amount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                       {selectedSale.kpay_amount > 0 ? '+' : ''}{selectedSale.kpay_amount.toLocaleString()} Ks
                    </span>
                 </div>
              </div>

              {/* Items Table */}
              <div className="mt-4">
                 <h4 className="font-bold mb-2">Items Sold</h4>
                 <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 text-left text-gray-500">
                        <th className="pb-1">Item</th>
                        <th className="pb-1 text-right">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                       {selectedSale.sale_items?.map((item, idx) => (
                         <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2">{item.product?.name || 'Unknown'}</td>
                            <td className="py-2 text-right">{item.qty}</td>
                            <td className="py-2 text-right">{item.price.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </NeoModal>

      {/* Product Edit Modal */}
      <NeoModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title={editProduct.id ? 'Edit Product' : 'Add Product'}>
         <div className="space-y-4">
            <NeoInput 
               label="Product Name" 
               value={editProduct.name || ''} 
               onChange={e => setEditProduct({...editProduct, name: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
               <NeoInput 
                  label="Buy Price" 
                  type="number" 
                  value={editProduct.buy_price || ''} 
                  onChange={e => setEditProduct({...editProduct, buy_price: Number(e.target.value)})}
               />
               <NeoInput 
                  label="Sell Price" 
                  type="number" 
                  value={editProduct.sell_price || ''} 
                  onChange={e => setEditProduct({...editProduct, sell_price: Number(e.target.value)})}
               />
            </div>
            <NeoInput 
               label="Stock" 
               type="number" 
               value={editProduct.stock || ''} 
               onChange={e => setEditProduct({...editProduct, stock: Number(e.target.value)})}
            />
            
            <div className="border-2 border-dashed border-black rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
               <input 
                 type="file" 
                 className="absolute inset-0 opacity-0 cursor-pointer"
                 onChange={e => e.target.files && setImageFile(e.target.files[0])} 
               />
               <p className="font-bold text-gray-500">{imageFile ? imageFile.name : 'Click to upload image'}</p>
            </div>

            <NeoButton onClick={handleSaveProduct} disabled={loading} className="w-full">
               {loading ? 'Saving...' : 'Save Product'}
            </NeoButton>
         </div>
      </NeoModal>
    </div>
  );
};