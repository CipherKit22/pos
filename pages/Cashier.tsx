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
  
  // New Payment State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('CASH');
  const [cashReceived, setCashReceived] = useState<string>('');
  
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

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.qty), 0), [cart]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // --- Payment Logic ---

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashReceived(''); // Reset
    setCustomerName('');
    setCustomerPhone('');
    setPaymentType('CASH');
    setPayModalOpen(true);
  };

  // Calculations
  const cReceived = parseInt(cashReceived) || 0;
  const isSufficient = paymentType === 'CASH' ? cReceived >= cartTotal : true;
  const change = paymentType === 'CASH' ? cReceived - cartTotal : 0;

  const handleConfirmSale = async () => {
    if (!isSufficient) return;
    setSubmitting(true);

    try {
      await db.createSale({
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        total: cartTotal,
        payment_type: paymentType,
        cash_amount: paymentType === 'CASH' ? cartTotal : 0, 
        mobile_money_amount: paymentType !== 'CASH' ? cartTotal : 0, 
        
        cash_received: paymentType === 'CASH' ? cReceived : undefined,
        change_amount: paymentType === 'CASH' ? change : undefined,
      }, cart.map(i => ({ product_id: i.id, qty: i.qty, price: i.price })));

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
                  <span className="text-purple-600 font-bold">{p.price.toLocaleString()} Ks</span>
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
                  <p className="text-xs text-gray-600">{item.price.toLocaleString()} x {item.qty}</p>
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
      <NeoModal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title="ငွေပေးချေမှု">
        <div className="space-y-6">
           <div className="text-center bg-gray-50 p-4 rounded-lg border border-black">
             <p className="text-gray-500 text-sm font-bold uppercase">Total Due</p>
             <h1 className="text-4xl font-black text-black">{cartTotal.toLocaleString()} Ks</h1>
           </div>

           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <NeoInput 
                    label="Customer Name (Optional)"
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="Mg Mg"
                  />
                  <NeoInput 
                    label="Phone Number (Optional)"
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="09..."
                  />
              </div>

              <div className="bg-[#FFF0F5] p-3 rounded-lg border border-black">
                 <p className="font-bold text-sm mb-2 text-center text-black">Payment Method:</p>
                 <div className="grid grid-cols-2 gap-2">
                    {['CASH', 'KBZPAY', 'WAVEPAY', 'AYAPAY'].map(method => (
                      <button 
                        key={method}
                        onClick={() => setPaymentType(method as PaymentType)}
                        className={`py-2 rounded font-bold border-2 border-black transition-all ${paymentType === method ? 'bg-[#A2D2FF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                      >
                        {method}
                      </button>
                    ))}
                 </div>
              </div>

              {paymentType === 'CASH' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <NeoInput 
                    label="Cash Received (လက်ခံငွေ)"
                    type="number" 
                    value={cashReceived} 
                    onChange={e => setCashReceived(e.target.value)} 
                    placeholder="Enter amount received"
                    autoFocus
                  />
                  
                  <div className="border-t-2 border-black pt-4 mt-4">
                     {isSufficient ? (
                       <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-black">
                          <span className="text-green-800 font-bold">Change (ပြန်အမ်းငွေ):</span>
                          <span className="font-black text-2xl text-green-900">{change.toLocaleString()} Ks</span>
                       </div>
                     ) : (
                       <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-2 border-black">
                          <span className="text-red-800 font-bold">Remaining (လိုငွေ):</span>
                          <span className="font-black text-2xl text-red-900">{Math.abs(change).toLocaleString()} Ks</span>
                       </div>
                     )}
                  </div>
                </div>
              )}
           </div>

           <NeoButton 
              className="w-full bg-[#FFADE7]" 
              size="lg" 
              onClick={handleConfirmSale} 
              disabled={submitting || !isSufficient}
           >
              {submitting ? 'Processing...' : 'အတည်ပြုမည် (Confirm)'}
           </NeoButton>
        </div>
      </NeoModal>
    </div>
  );
};