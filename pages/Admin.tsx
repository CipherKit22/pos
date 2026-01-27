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
                     <p className="font-bold mb-2">Cash ရရှိငွေ</p>
                     <h2 className="text-3xl font-black text-green-900">{stats.cashTotal.toLocaleString()} Ks</h2>
                  </NeoCard>
                  <NeoCard color="bg-[#FFEF96]">
                     <p className="font-bold mb-2">KPay ရရှိငွေ</p>
                     <h2 className="text-3xl font-black text-orange-900">{stats.kpayTotal.toLocaleString()} Ks</h2>
                  </NeoCard>
                  
                  <div className="col-span-full md:col-span-2 mt-4">
                    <NeoCard className="min-h-[300px] flex items-center justify-center text-gray-400 font-bold bg-white">
                        <RechartsWrapper data={sales} />
                    </NeoCard>
                  </div>
               </div>
            )}

            {/* SALES TAB */}
            {activeTab === AdminTab.SALES && (
               <NeoCard className="overflow-hidden p-0" color="bg-white">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 border-b-2 border-black text-black">
                        <tr>
                          <th className="p-4">Time</th>
                          <th className="p-4">Total</th>
                          <th className="p-4">Profit</th>
                          <th className="p-4">Payment</th>
                          <th className="p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-black">
                        {sales.map(sale => (
                          <tr key={sale.id} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
                            <td className="p-4 font-mono text-sm">{new Date(sale.created_at).toLocaleString()}</td>
                            <td className="p-4 font-bold">{sale.total.toLocaleString()}</td>
                            <td className="p-4 text-green-600 font-bold">+{sale.profit.toLocaleString()}</td>
                            <td className="p-4">
                              <NeoBadge color={sale.payment_type === 'KPAY' ? 'bg-blue-200' : sale.payment_type === 'CASH' ? 'bg-green-200' : 'bg-yellow-200'}>
                                 {sale.payment_type}
                              </NeoBadge>
                            </td>
                            <td className="p-4">
                               <button onClick={() => setSelectedSale(sale)} className="text-sm underline decoration-2 decoration-purple-400 hover:text-purple-600 font-bold">Detail</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </NeoCard>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === AdminTab.PRODUCTS && (
              <div>
                <div className="flex justify-end mb-4">
                   <NeoButton className="bg-[#B0F2B4]" onClick={() => { setEditProduct({}); setProductModalOpen(true); }}>+ ပစ္စည်းအသစ်ထည့်မည်</NeoButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {products.map(prod => (
                     <NeoCard key={prod.id} className="relative group" color="bg-white">
                        <div className="flex gap-4">
                           <div className="w-16 h-16 bg-gray-200 rounded border border-black overflow-hidden flex-shrink-0">
                              {prod.image_url && <img src={prod.image_url} className="w-full h-full object-cover" />}
                           </div>
                           <div className="text-black">
                              <h3 className="font-bold">{prod.name}</h3>
                              <p className="text-sm text-gray-500">Stock: {prod.stock}</p>
                              <p className="text-sm font-bold text-purple-600">{prod.sell_price} Ks</p>
                           </div>
                        </div>
                        <button 
                          className="absolute top-2 right-2 p-2 bg-yellow-200 border border-black rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => { setEditProduct(prod); setProductModalOpen(true); }}
                        >
                          ✏️
                        </button>
                     </NeoCard>
                   ))}
                </div>
              </div>
            )}
            
            {/* PAYMENTS TAB */}
            {activeTab === AdminTab.PAYMENTS && (
                 <div className="space-y-4">
                   <NeoCard color="bg-white">
                      <h3 className="font-bold text-xl mb-4 text-black">Payment Breakdown</h3>
                      <div className="space-y-4 text-black">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                              <span className="font-bold">Total Cash Collected</span>
                              <span className="text-xl">{stats.cashTotal.toLocaleString()} Ks</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                              <span className="font-bold">Total KPay Received</span>
                              <span className="text-xl">{stats.kpayTotal.toLocaleString()} Ks</span>
                          </div>
                      </div>
                   </NeoCard>
                 </div>
            )}
          </>
        )}
      </div>

      {/* --- Modals --- */}

      {/* Sale Detail Modal */}
      <NeoModal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title="အရောင်းမှတ်တမ်း">
         {selectedSale && (
           <div className="space-y-4 text-black">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded border border-black">
                 <div>
                   <span className="block text-gray-500">Date</span>
                   <b>{new Date(selectedSale.created_at).toLocaleString()}</b>
                 </div>
                 <div>
                   <span className="block text-gray-500">Payment</span>
                   <b>{selectedSale.payment_type}</b>
                 </div>
                 {selectedSale.payment_type !== 'CASH' && (
                   <div>
                     <span className="block text-gray-500">KPay</span>
                     <b>{selectedSale.kpay_amount} Ks</b>
                   </div>
                 )}
                 {selectedSale.payment_type !== 'KPAY' && (
                   <div>
                     <span className="block text-gray-500">Cash</span>
                     <b>{selectedSale.cash_amount} Ks</b>
                   </div>
                 )}
              </div>
              
              <div className="border-t-2 border-black pt-4">
                <h4 className="font-bold mb-2">Items</h4>
                <ul className="space-y-2">
                   {selectedSale.sale_items?.map((item, idx) => (
                      <li key={idx} className="flex justify-between border-b border-gray-200 pb-1">
                         <span>{item.product?.name || 'Unknown'} <small className="text-gray-500">x{item.qty}</small></span>
                         <span>{(item.qty * item.price).toLocaleString()}</span>
                      </li>
                   ))}
                </ul>
                <div className="flex justify-between mt-4 text-xl font-bold">
                   <span>Total</span>
                   <span>{selectedSale.total.toLocaleString()} Ks</span>
                </div>
              </div>
           </div>
         )}
      </NeoModal>

      {/* Product Edit/Add Modal */}
      <NeoModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title={editProduct.id ? 'ပစ္စည်းပြင်ဆင်ရန်' : 'ပစ္စည်းအသစ်'}>
         <div className="space-y-4">
            <NeoInput 
              label="Product Name (အမည်)" 
              value={editProduct.name || ''} 
              onChange={e => setEditProduct({...editProduct, name: e.target.value})} 
            />
            <div className="flex gap-2">
               <NeoInput 
                 label="Buy Price (ဝယ်ဈေး)" 
                 type="number"
                 value={editProduct.buy_price || ''} 
                 onChange={e => setEditProduct({...editProduct, buy_price: Number(e.target.value)})} 
               />
               <NeoInput 
                 label="Sell Price (ရောင်းဈေး)" 
                 type="number"
                 value={editProduct.sell_price || ''} 
                 onChange={e => setEditProduct({...editProduct, sell_price: Number(e.target.value)})} 
               />
            </div>
            <NeoInput 
                 label="Stock (လက်ကျန်)" 
                 type="number"
                 value={editProduct.stock || ''} 
                 onChange={e => setEditProduct({...editProduct, stock: Number(e.target.value)})} 
            />
            
            <div className="w-full text-black">
               <label className="block font-bold mb-1 text-sm">Image</label>
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={e => e.target.files && setImageFile(e.target.files[0])}
                 className="w-full border-2 border-black rounded-lg p-2 bg-white"
               />
               {(editProduct.image_url || imageFile) && <p className="text-xs text-green-600 mt-1">Image selected</p>}
            </div>

            <NeoButton className="w-full bg-[#A2D2FF] mt-4" onClick={handleSaveProduct} disabled={loading}>
              {loading ? 'Saving...' : 'သိမ်းဆည်းမည်'}
            </NeoButton>
         </div>
      </NeoModal>
    </div>
  );
};