import React, { useState, useEffect, useMemo } from 'react';
import { useCafe } from '../store/CafeContext';
import { Layout } from '../components/Layout';
import { UserRole, TableStatus, MenuItem, OrderStatus, Order, CartItem } from '../types';
import { MENU_ITEMS, CATEGORIES } from '../constants';
import { QrCode, Search, Minus, Plus, ShoppingBag, ArrowRight, Utensils, CheckCircle, Clock, ChefHat, Receipt, Sparkles } from 'lucide-react';
import { RecommendationEngine } from '../utils/RecommendationEngine';

// Steps in the customer journey
type CustomerStep = 'MODE_SELECT' | 'TABLE_SELECT' | 'QR_SCAN' | 'MENU' | 'ORDER_TRACKING' | 'PAYMENT';

export const CustomerDashboard: React.FC = () => {
  const { isOnlineMode, tables, orders, placeOrder, currentUser } = useCafe();
  const [currentStep, setCurrentStep] = useState<CustomerStep>('MODE_SELECT');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Beverages');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // 🤖 AI Recommendations - Generated based on user's order history and time of day
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);

  // 1. Automatic Session Recovery
  const activeUserOrder = useMemo(() => {
    if (!currentUser) return null;
    return orders.find(o => 
      o.customerName === currentUser.name && 
      o.status !== OrderStatus.COMPLETED
    );
  }, [orders, currentUser]);

  // If user has an active order, switch to Tracking or Payment view
  useEffect(() => {
    if (activeUserOrder) {
      setSelectedTable(activeUserOrder.tableId);
      if (activeUserOrder.isBillGenerated) {
        setCurrentStep('PAYMENT');
      } else {
        setCurrentStep('ORDER_TRACKING');
      }
    } else if (currentStep === 'ORDER_TRACKING' || currentStep === 'PAYMENT') {
        // Order completed/cleared, go back to start or menu
        setCurrentStep('MODE_SELECT');
    }
  }, [activeUserOrder, activeUserOrder?.isBillGenerated]);

  // 2. 🤖 AI RECOMMENDATIONS - Auto-update when orders change
  /**
   * This effect uses our rule-based AI recommendation engine to generate personalized
   * recommendations based on:
   * - User's past order history (frequency analysis)
   * - Current time of day (morning/afternoon/evening/night)
   * - Menu categories
   * 
   * The recommendations update automatically whenever orders change (user places a new order)
   * This shows an AI-style responsive system without ML or external APIs.
   */
  useEffect(() => {
    if (currentUser?.name) {
      // Generate fresh recommendations using the AI engine
      const recommended = RecommendationEngine.getRecommendedItems(currentUser.name, orders);
      setRecommendations(recommended);
    }
  }, [orders, currentUser?.name]);

  // -- HANDLERS --

  const handleModeSelect = (mode: 'online' | 'offline') => {
    if (mode === 'online' && !isOnlineMode) return;
    setCurrentStep('TABLE_SELECT');
  };

  const handleTableSelect = (tableId: number, status: TableStatus, occupiedByMe: boolean) => {
    if (status === TableStatus.OCCUPIED && !occupiedByMe) return;
    
    setSelectedTable(tableId);
    
    // If it's my table, skip scan
    if (occupiedByMe) {
        setCurrentStep('ORDER_TRACKING');
    } else {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setCurrentStep('MENU');
        }, 1500); 
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) return { ...i, quantity: i.quantity - 1 };
      return i;
    }).filter(i => i.quantity > 0));
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = () => {
    if (!selectedTable || cart.length === 0) return;
    
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tableId: selectedTable,
      items: cart,
      status: OrderStatus.PENDING,
      totalAmount: calculateTotal(),
      timestamp: Date.now(),
      customerName: currentUser?.name || "Guest"
    };

    placeOrder(newOrder);
    setCart([]); 
    setCurrentStep('ORDER_TRACKING');
  };

  const handleRequestBill = () => {
    setCurrentStep('PAYMENT');
  };

  const filteredItems = MENU_ITEMS.filter(item => 
    item.category === activeCategory && 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTableOccupantName = (tableId: number) => {
    const activeOrder = orders.find(o => o.tableId === tableId && o.status !== OrderStatus.COMPLETED);
    return activeOrder ? activeOrder.customerName : null;
  };

  // -- RENDERERS --

  if (currentStep === 'MODE_SELECT') {
    return (
      <Layout role={UserRole.CUSTOMER} title="Welcome">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 md:mt-10">
          <div 
            onClick={() => handleModeSelect('online')}
            className={`relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer h-56 md:h-64 flex flex-col justify-center
              ${isOnlineMode 
                ? 'bg-white border-brand-orange/20 hover:border-brand-orange hover:shadow-xl' 
                : 'bg-cafe-100 border-transparent opacity-60 cursor-not-allowed'}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShoppingBag size={100} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Online Order</h2>
            <p className="text-cafe-600 mb-4">Pre-book table or takeaway</p>
            {!isOnlineMode && (
              <span className="inline-block bg-cafe-200 text-cafe-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Currently Unavailable
              </span>
            )}
          </div>

          <div 
            onClick={() => handleModeSelect('offline')}
            className="relative overflow-hidden bg-white p-8 rounded-2xl border-2 border-brand-orange/20 hover:border-brand-orange hover:shadow-xl transition-all duration-300 cursor-pointer h-56 md:h-64 flex flex-col justify-center"
          >
             <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-orange">
              <Utensils size={100} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Dine-In</h2>
            <p className="text-cafe-600">Scan QR at table to order</p>
            <div className="mt-4 flex items-center text-brand-orange font-bold">
              Start <ArrowRight className="ml-2" size={20} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isScanning) {
    return (
      <Layout role={UserRole.CUSTOMER} title="Scanning...">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="relative w-64 h-64 bg-black rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 border-4 border-brand-orange/50 animate-pulse rounded-3xl"></div>
            <QrCode size={100} className="text-white/80" />
            <div className="absolute w-full h-1 bg-brand-orange top-0 animate-[scan_2s_ease-in-out_infinite]" />
          </div>
          <h2 className="mt-8 text-xl font-bold text-cafe-800">Scanning Table {selectedTable} QR...</h2>
          <style>{`
            @keyframes scan {
              0% { top: 0; }
              50% { top: 100%; }
              100% { top: 0; }
            }
          `}</style>
        </div>
      </Layout>
    );
  }

  if (currentStep === 'TABLE_SELECT') {
    return (
      <Layout role={UserRole.CUSTOMER} title="Select Table">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto mt-8">
          {tables.map(table => {
            const occupant = getTableOccupantName(table.id);
            const isOccupiedByMe = occupant === currentUser?.name;
            const isOccupiedByOther = table.status === TableStatus.OCCUPIED && !isOccupiedByMe;

            return (
              <button
                key={table.id}
                disabled={isOccupiedByOther}
                onClick={() => handleTableSelect(table.id, table.status, isOccupiedByMe)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200
                  ${isOccupiedByMe
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-md transform scale-105'
                    : table.status === TableStatus.EMPTY 
                      ? 'bg-white border-2 border-cafe-200 hover:border-brand-orange hover:shadow-lg' 
                      : table.status === TableStatus.RESERVED 
                        ? 'bg-amber-50 border-2 border-amber-200 text-amber-700'
                        : 'bg-cafe-200 border-2 border-transparent cursor-not-allowed opacity-50'
                  }`}
              >
                <div className="text-3xl font-bold mb-1">{table.id}</div>
                <div className="text-xs font-medium uppercase tracking-wider text-center px-1">
                  {isOccupiedByMe ? 'YOUR TABLE' : table.status}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-center mt-8 text-cafe-500 text-sm">Select your table number to scan QR</p>
      </Layout>
    );
  }

  // Active Order View - Replaces Menu when order is in progress
  if (currentStep === 'ORDER_TRACKING' && activeUserOrder) {
    return (
      <Layout role={UserRole.CUSTOMER} title={`Table ${selectedTable} - Tracking`}>
         <div className="max-w-lg mx-auto mt-6">
            
            {/* Status Banner */}
            <div className={`p-6 rounded-2xl flex flex-col items-center text-center shadow-lg mb-8 transition-colors duration-500
              ${activeUserOrder.status === OrderStatus.READY ? 'bg-green-600 text-white' : 
                activeUserOrder.status === OrderStatus.PREPARING ? 'bg-brand-orange text-white' : 'bg-cafe-800 text-white'}`}>
                
                <div className="bg-white/20 p-4 rounded-full mb-4 animate-bounce-slight">
                   {activeUserOrder.status === OrderStatus.READY ? <CheckCircle size={40} /> : 
                    activeUserOrder.status === OrderStatus.PREPARING ? <ChefHat size={40} /> : <Clock size={40} />}
                </div>
                
                <h2 className="text-2xl font-bold mb-1">
                  {activeUserOrder.status === OrderStatus.READY ? 'Order Ready!' : 
                   activeUserOrder.status === OrderStatus.PREPARING ? 'Cooking in Progress' : 'Order Received'}
                </h2>
                <p className="opacity-90">
                   {activeUserOrder.status === OrderStatus.READY ? 'Please enjoy your meal.' : 
                    activeUserOrder.status === OrderStatus.PREPARING ? 'Kitchen is preparing your items.' : 'Waiting for kitchen confirmation.'}
                </p>
            </div>

            {/* Ordered Items List */}
            <div className="bg-white rounded-2xl shadow-sm border border-cafe-100 overflow-hidden mb-8">
              <div className="p-4 bg-cafe-50 border-b border-cafe-100 flex justify-between items-center">
                <h3 className="font-bold text-cafe-800 flex items-center gap-2"><Receipt size={18}/> Your Ordered Items</h3>
                <span className="text-xs bg-white px-2 py-1 rounded border border-cafe-200 text-cafe-500">#{activeUserOrder.id.slice(-4)}</span>
              </div>
              <div className="divide-y divide-cafe-50">
                {activeUserOrder.items.map((item, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="bg-cafe-100 w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-cafe-700">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="font-medium text-cafe-900">{item.name}</p>
                          <p className="text-xs text-cafe-500">
                             {activeUserOrder.status === OrderStatus.PENDING ? 'Queued' : activeUserOrder.status === OrderStatus.PREPARING ? 'Preparing...' : 'Ready'}
                          </p>
                        </div>
                     </div>
                     <span className="font-semibold text-cafe-600">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-cafe-50 border-t border-cafe-100 flex justify-between items-center">
                 <span className="text-cafe-500 font-medium">Total Amount</span>
                 <span className="text-xl font-bold text-cafe-900">₹{activeUserOrder.totalAmount.toFixed(0)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {activeUserOrder.status === OrderStatus.READY && (
               <button 
                  onClick={handleRequestBill}
                  className="w-full bg-cafe-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
               >
                 Request Bill & Pay <ArrowRight size={20} />
               </button>
            )}
            
             {activeUserOrder.status !== OrderStatus.READY && (
               <div className="text-center text-sm text-cafe-400 italic">
                 You can request the bill once food is ready.
               </div>
            )}
         </div>
      </Layout>
    );
  }

  if (currentStep === 'MENU') {
    return (
      <Layout role={UserRole.CUSTOMER} title={`Table ${selectedTable}`}>
        
        {/* 🤖 RECOMMENDED FOR YOU SECTION */}
        {recommendations.length > 0 && (
          <div className="mb-8 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-brand-orange animate-pulse" />
              <h2 className="text-lg font-bold text-cafe-800">Recommended for you</h2>
              <span className="text-xs bg-brand-orange text-white px-2 py-1 rounded-full">AI picks</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recommendations.map(item => {
                const cartItem = cart.find(c => c.id === item.id);
                const qty = cartItem ? cartItem.quantity : 0;
                return (
                  <div 
                    key={item.id} 
                    className="bg-white p-3 rounded-xl border-2 border-brand-orange/30 hover:border-brand-orange hover:shadow-md transition-all cursor-pointer group"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-20 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                    />
                    <h3 className="font-bold text-cafe-800 text-xs line-clamp-2 mb-1">{item.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-brand-orange">₹{item.price}</span>
                      {qty > 0 ? (
                        <div className="flex items-center bg-orange-50 rounded gap-1 text-xs">
                          <button 
                            onClick={() => removeFromCart(item.id)} 
                            className="w-5 h-5 hover:bg-orange-200 text-brand-orange flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-4 text-center font-bold">{qty}</span>
                          <button 
                            onClick={() => addToCart(item)} 
                            className="w-5 h-5 hover:bg-orange-200 text-brand-orange flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(item)} 
                          className="px-2 py-1 text-xs font-bold text-brand-orange hover:bg-orange-100 rounded"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-6 px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium text-sm
                ${activeCategory === cat.id 
                  ? 'bg-cafe-800 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-cafe-600 hover:bg-cafe-100 border border-transparent'}`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-400" size={18} />
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-cafe-200 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 bg-white shadow-sm text-sm"
          />
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
          {filteredItems.map(item => {
             const cartItem = cart.find(c => c.id === item.id);
             const qty = cartItem ? cartItem.quantity : 0;
             return (
              <div key={item.id} className="bg-white p-3 rounded-2xl border border-cafe-100 shadow-sm hover:shadow-md transition-all flex gap-3">
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl bg-cafe-50" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-cafe-800 text-sm line-clamp-1">{item.name}</h3>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.type === 'veg' ? 'bg-green-500' : item.type === 'non-veg' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    </div>
                    <p className="text-xs text-cafe-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-base">₹{item.price}</span>
                    
                    <div className="flex items-center bg-cafe-50 rounded-lg overflow-hidden border border-cafe-200 h-8">
                        {qty > 0 ? (
                          <>
                            <button onClick={() => removeFromCart(item.id)} className="w-8 h-full hover:bg-cafe-200 text-brand-orange flex items-center justify-center">
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-medium text-xs">{qty}</span>
                            <button onClick={() => addToCart(item)} className="w-8 h-full hover:bg-cafe-200 text-brand-orange flex items-center justify-center">
                              <Plus size={14} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => addToCart(item)} className="px-3 h-full text-xs font-bold text-brand-orange hover:bg-orange-50 uppercase tracking-wide">
                            ADD
                          </button>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Cart Footer */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 max-w-7xl mx-auto z-40">
            <button 
              onClick={handlePlaceOrder}
              className="w-full bg-brand-orange text-white p-4 rounded-2xl shadow-xl flex justify-between items-center font-bold hover:bg-orange-600 transition-colors animate-bounce-slight"
            >
              <div className="flex flex-col text-left">
                <span className="text-xs opacity-90">{cart.reduce((a,c) => a + c.quantity, 0)} Items</span>
                <span>₹{calculateTotal().toFixed(0)}</span>
              </div>
              <div className="flex items-center">
                Place Order <ArrowRight className="ml-2" size={20} />
              </div>
            </button>
          </div>
        )}
      </Layout>
    );
  }

  if (currentStep === 'PAYMENT') {
    const total = activeUserOrder ? activeUserOrder.totalAmount : 0;
    const isBillReady = activeUserOrder?.isBillGenerated;
    
    return (
      <Layout role={UserRole.CUSTOMER} title="Payment">
        <div className="max-w-md mx-auto mt-8 bg-white p-8 rounded-3xl shadow-xl border border-cafe-100 text-center">
          <h2 className="text-2xl font-bold text-cafe-800 mb-2">Total Bill</h2>
          <div className="text-4xl font-bold text-brand-orange mb-8">₹{total.toFixed(0)}</div>
          
          {isBillReady ? (
            <div className="animate-in zoom-in duration-300">
               {/* QR CODE REMOVED FROM HERE - Instructions added */}
               <div className="bg-cafe-50 p-6 rounded-2xl mb-6 border border-cafe-200">
                  <QrCode size={64} className="mx-auto text-cafe-400 mb-4" />
                  <h3 className="font-bold text-cafe-800 text-lg mb-2">Scan QR on Admin Screen</h3>
                  <p className="text-sm text-cafe-600">Please go to the counter. The Admin will show you the QR code for payment.</p>
               </div>
              
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="font-medium text-sm">Waiting for Payment Confirmation...</span>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <div className="bg-orange-50 text-orange-800 p-6 rounded-2xl mb-6">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-lg mb-2">Requesting Bill...</h3>
                <p className="text-sm opacity-80">Please wait while the Admin generates your bill.</p>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return <div>Loading...</div>;
};