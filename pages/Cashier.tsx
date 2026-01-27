import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../services/db';
import { Product, CartItem, PaymentType } from '../types';
import { NeoButton, NeoCard, NeoInput, NeoModal, NeoLoader } from '../components/NeoUI';
import { Link } from 'react-router-dom';

export const Cashier: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [isPayModalOpen, setPayModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('CASH');
  const [cashInput, setCashInput] = useState<string>('');
  const [kpayInput, setKpayInput] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await db.getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(p => {
        if (p.id === id) {
          const newQty = p.qty + delta;
          if (newQty <= 0) return p;
          // Check stock
          const product = products.find(prod => prod.id === id);
          if (product && newQty > product.stock) return p;
          return { ...p, qty: newQty };
        }
        return p;
      });
    });
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.sell_price * item.qty), 0), [cart]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // --- Payment Logic ---

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashInput(cartTotal.toString()); // Default to full cash
    setKpayInput('0');
    setPaymentType('CASH');
    setPayModalOpen(true);
  };

  const handleCashChange = (val: string) => {
    setCashInput(val);
    if (paymentType === 'MIXED') {
      const c = parseInt(val) || 0;
      setKpayInput((Math.max(0, cartTotal - c)).toString());
    }
  };

  const handleKpayChange = (val: string) => {
    setKpayInput(val);
    if (paymentType === 'MIXED') {
      const k = parseInt(val) || 0;
      setCashInput((Math.max(0, cartTotal - k)).toString());
    }
  };

  const handleConfirmSale = async () => {
    setSubmitting(true);
    const cAmount = parseInt(cashInput) || 0;
    const kAmount = parseInt(kpayInput) || 0;

    // Validate
    if ((cAmount + kAmount) < cartTotal) {
      alert('ပေးချေမှုပမာဏ မလုံလောက်ပါ (Insufficient Payment)');
      setSubmitting(false);
      return;
    }

    // Profit Calc
    const totalBuyPrice = cart.reduce((sum, item) => sum + (item.buy_price * item.qty), 0);
    const profit = cartTotal - totalBuyPrice;

    try {
      await db.createSale({
        total: cartTotal,
        profit,
        payment_type: paymentType,
        cash_amount: paymentType === 'KPAY' ? 0 : cAmount,
        kpay_amount: paymentType === 'CASH' ? 0 : kAmount
      }, cart.map(i => ({ product_id: i.id, qty: i.qty, price: i.sell_price })));

      setCart([]);
      setPayModalOpen(false);
      loadProducts(); // Refresh stock
    } catch (e) {
      console.error(e);
      alert('Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen md:flex-row overflow-hidden">
      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDF4F5]">
        <header className="p-4 flex justify-between items-center border-b-2 border-black bg-white">
          <h1 className="text-2xl font-bold font-['Padauk'] text-black">ဈေးဆိုင် (Cashier)</h1>
          <Link to="/admin">
            <NeoButton variant="secondary" size="sm">Admin</NeoButton>
          </Link>
        </header>
        
        <div className="p-4">
          <NeoInput 
            placeholder="ပစ္စည်းရှာရန်..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="text-white bg-black placeholder:text-gray-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 md:pb-4">
          {loading ? <div className="col-span-full"><NeoLoader /></div> : filteredProducts.map(p => (
            <NeoCard 
              key={p.id} 
              className={`flex flex-col justify-between cursor-pointer transition-transform hover:scale-[1.02] ${p.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
              color="bg-white"
              onClick={() => addToCart(p)}
            >
              <div className="h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden border-2 border-black">
                {p.image_url ? (
                   <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-black leading-tight mb-1">{p.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-purple-600 font-bold">{p.sell_price.toLocaleString()} Ks</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border border-black text-black ${p.stock < 5 ? 'bg-red-200' : 'bg-green-200'}`}>
                    {p.stock} left
                  </span>
                </div>
              </div>
            </NeoCard>
          ))}
        </div>
      </div>

      {/* Cart Area */}
      <div className="md:w-96 bg-white border-l-2 border-black flex flex-col h-[40vh] md:h-full shadow-[-4px_0px_0px_0px_rgba(0,0,0,0.1)] z-10">
        <div className="p-4 bg-[#FFADE7] border-b-2 border-black">
          <h2 className="text-xl font-bold flex items-center gap-2 text-black">
            <span>🛒</span> ခြင်းတောင်း ({cart.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
             <div className="text-center text-gray-500 mt-10">ခြင်းတောင်းအလွတ်ဖြစ်နေသည်</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-black">
                <div className="flex-1 text-black">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.sell_price.toLocaleString()} x {item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white border border-black rounded hover:bg-red-100 text-black">-</button>
                   <span className="font-bold w-4 text-center text-black">{item.qty}</span>
                   <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-black rounded hover:bg-green-100 text-black">+</button>
                   <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500">×</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t-2 border-black bg-gray-50 text-black">
          <div className="flex justify-between items-center mb-4 text-xl font-bold">
            <span>စုစုပေါင်း</span>
            <span>{cartTotal.toLocaleString()} Ks</span>
          </div>
          <NeoButton 
            className="w-full" 
            size="lg" 
            disabled={cart.length === 0}
            onClick={handleOpenPayment}
          >
            ငွေချေမည် (Confirm)
          </NeoButton>
        </div>
      </div>

      {/* Payment Modal */}
      <NeoModal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title="ငွေပေးချေမှုစနစ်">
        <div className="space-y-6">
           <div className="text-center mb-6">
             <p className="text-gray-500">ပေးချေရမည့်ပမာဏ</p>
             <h1 className="text-4xl font-bold text-purple-600">{cartTotal.toLocaleString()} Ks</h1>
           </div>

           <div className="grid grid-cols-3 gap-2">
             <NeoButton 
               variant={paymentType === 'CASH' ? 'primary' : 'ghost'} 
               className={paymentType === 'CASH' ? 'bg-[#B0F2B4]' : 'bg-gray-100'}
               onClick={() => { setPaymentType('CASH'); setCashInput(cartTotal.toString()); setKpayInput('0'); }}
             >
               Cash
             </NeoButton>
             <NeoButton 
               variant={paymentType === 'KPAY' ? 'primary' : 'ghost'} 
               className={paymentType === 'KPAY' ? 'bg-[#A2D2FF]' : 'bg-gray-100'}
               onClick={() => { setPaymentType('KPAY'); setKpayInput(cartTotal.toString()); setCashInput('0'); }}
             >
               KPay
             </NeoButton>
             <NeoButton 
               variant={paymentType === 'MIXED' ? 'primary' : 'ghost'} 
               className={paymentType === 'MIXED' ? 'bg-[#FFEF96]' : 'bg-gray-100'}
               onClick={() => { setPaymentType('MIXED'); setCashInput(''); setKpayInput(''); }}
             >
               Mix
             </NeoButton>
           </div>

           <div className="space-y-4 p-4 bg-gray-50 rounded-xl border-2 border-black border-dashed text-black">
              {/* Cash Input */}
              {(paymentType === 'CASH' || paymentType === 'MIXED') && (
                <div className="flex items-center gap-2">
                   <label className="w-20 font-bold">Cash:</label>
                   <NeoInput 
                      type="number" 
                      value={cashInput} 
                      onChange={e => handleCashChange(e.target.value)} 
                      disabled={paymentType === 'CASH'} // Auto filled if cash only
                   />
                </div>
              )}

              {/* KPay Input */}
              {(paymentType === 'KPAY' || paymentType === 'MIXED') && (
                <div className="flex items-center gap-2">
                   <label className="w-20 font-bold">KPay:</label>
                   <NeoInput 
                      type="number" 
                      value={kpayInput} 
                      onChange={e => handleKpayChange(e.target.value)}
                      disabled={paymentType === 'KPAY'}
                   />
                </div>
              )}
           </div>

           <div className="flex justify-between items-center text-sm font-bold text-gray-600 px-2">
              <span>Total Received: {(parseInt(cashInput)||0) + (parseInt(kpayInput)||0)}</span>
              <span>Required: {cartTotal}</span>
           </div>

           <NeoButton className="w-full bg-[#FFADE7]" size="lg" onClick={handleConfirmSale} disabled={submitting}>
              {submitting ? 'Processing...' : 'အရောင်းအတည်ပြုမည်'}
           </NeoButton>
        </div>
      </NeoModal>
    </div>
  );
};