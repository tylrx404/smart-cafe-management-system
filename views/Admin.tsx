import React, { useState } from 'react';
import { useCafe } from '../store/CafeContext';
import { Layout } from '../components/Layout';
import { UserRole, TableStatus, OrderStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { DollarSign, ToggleLeft, ToggleRight, CheckSquare, RefreshCw, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { CalendarHeatmap } from '../components/CalendarHeatmap';

export const AdminDashboard: React.FC = () => {
  const { isOnlineMode, setOnlineMode, tables, orders, resetTable, generateBill, refreshData } = useCafe();
  const [viewingQrFor, setViewingQrFor] = useState<string | null>(null);
  const [generatedQrCode, setGeneratedQrCode] = useState<string>('');

  // -- ANALYTICS DATA --
  const itemCounts: Record<string, number> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });
  
  const pieData = Object.keys(itemCounts)
    .map(name => ({ name, value: itemCounts[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); 

  const COLORS = ['#ea580c', '#fb923c', '#fdba74', '#a8a29e', '#d6d3d1'];

  const readyOrders = orders.filter(o => o.status === OrderStatus.READY);
  const totalRevenue = orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((acc, o) => acc + o.totalAmount, 0);

  const generateUpiQrCode = async (orderId: string, amount: number) => {
    try {
      // Generate UPI payment URL with order details
      const upiUrl = `upi://pay?pa=cafe@upi&pn=Restaurant%20Cafe&am=${amount}&cu=INR&tn=Order%20${orderId.slice(-4)}`;
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setGeneratedQrCode(qrDataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setGeneratedQrCode('');
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      generateBill(orderId);
      await generateUpiQrCode(orderId, order.totalAmount);
      setViewingQrFor(orderId);
    }
  };

  const handleViewQrCode = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await generateUpiQrCode(orderId, order.totalAmount);
      setViewingQrFor(orderId);
    }
  };

  const handleConfirmPayment = (tableId: string) => {
    resetTable(tableId);
    setViewingQrFor(null);
    setGeneratedQrCode('');
  };

  const activeQrOrder = viewingQrFor ? orders.find(o => o.id === viewingQrFor) : null;

  return (
    <Layout role={UserRole.ADMIN} title="Control Center">
      {/* QR Code Overlay Modal */}
      {activeQrOrder && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => {
                    setViewingQrFor(null);
                    setGeneratedQrCode('');
                  }}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
                >
                  <X size={20} />
                </button>
                
                <h3 className="text-xl font-bold text-cafe-800 mb-1">Table {activeQrOrder.tableId} Bill</h3>
                <p className="text-cafe-500 text-sm mb-6">Scan to Pay</p>
                
                <div className="bg-white p-4 border-4 border-cafe-900 rounded-2xl inline-block mb-6">
                  {generatedQrCode ? (
                    <img 
                      src={generatedQrCode} 
                      alt="UPI QR Code"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <QrCode size={200} className="text-black" />
                    </div>
                  )}
                </div>
                
                <div className="text-4xl font-bold text-cafe-900 mb-2">₹{activeQrOrder.totalAmount.toFixed(0)}</div>
                <p className="text-xs text-cafe-400 mb-6">Order #{activeQrOrder.id.slice(-4)}</p>

                <button 
                  onClick={() => handleConfirmPayment(activeQrOrder.tableId)}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckSquare size={20} /> Confirm Payment Received
                </button>
             </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Controls & Actions */}
        <div className="space-y-8">
          
          {/* Mode Control */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-cafe-200">
            <h3 className="text-lg font-bold text-cafe-800 mb-4 flex items-center justify-between">
              System Mode
              <button onClick={refreshData} title="Reset All Data" className="text-xs text-red-400 hover:text-red-600"><RefreshCw size={14}/></button>
            </h3>
            <div className="flex items-center justify-between bg-cafe-50 p-4 rounded-xl">
              <div>
                <p className="font-bold text-cafe-900">Online Ordering</p>
                <p className="text-xs text-cafe-500">{isOnlineMode ? 'Customers can order remotely' : 'Dine-in only enabled'}</p>
              </div>
              <button 
                onClick={() => setOnlineMode(!isOnlineMode)}
                className={`transition-all duration-300 ${isOnlineMode ? 'text-brand-green' : 'text-cafe-400'}`}
              >
                {isOnlineMode ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>
          </div>

          {/* Payment / Billing Queue */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-cafe-200">
             <h3 className="text-lg font-bold text-cafe-800 mb-4 flex items-center gap-2">
               <DollarSign size={20} className="text-brand-green" />
               Billing Queue
             </h3>
             <div className="space-y-3">
               {readyOrders.length === 0 ? (
                 <div className="text-center py-8 text-cafe-400 bg-cafe-50 rounded-xl border-dashed border border-cafe-200">
                    <p className="text-sm">No orders ready for billing.</p>
                 </div>
               ) : readyOrders.map(order => (
                 <div key={order.id} className={`p-4 rounded-xl border ${order.isBillGenerated ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-cafe-900">Table {order.tableId}</p>
                        <p className="text-xs text-cafe-500">{order.customerName}</p>
                      </div>
                      <p className="font-bold text-lg">₹{order.totalAmount.toFixed(0)}</p>
                    </div>

                    {!order.isBillGenerated ? (
                      <button 
                        onClick={() => handleGenerateBill(order.id)}
                        className="w-full bg-brand-orange text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
                      >
                        <QrCode size={16} /> Generate Bill QR
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewQrCode(order.id)}
                          className="flex-1 bg-white border border-cafe-300 text-cafe-700 py-2 rounded-lg text-sm font-bold hover:bg-cafe-50 flex items-center justify-center"
                        >
                           <QrCode size={16} /> View QR
                        </button>
                        <button 
                          onClick={() => handleConfirmPayment(order.tableId)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 flex items-center justify-center"
                        >
                          Confirm Paid
                        </button>
                      </div>
                    )}
                 </div>
               ))}
             </div>
          </div>

          {/* Table Grid Status */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-cafe-200">
            <h3 className="text-lg font-bold text-cafe-800 mb-4">Live Tables</h3>
            <div className="grid grid-cols-3 gap-2">
              {tables.map(table => (
                 <div 
                   key={table.id}
                   className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border transition-colors
                     ${table.status === TableStatus.EMPTY ? 'bg-white border-cafe-200 text-cafe-400' :
                       table.status === TableStatus.OCCUPIED ? 'bg-orange-100 border-orange-200 text-orange-700' :
                       'bg-gray-100 text-gray-400'}`}
                 >
                   {table.id}
                 </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-cafe-500">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white border border-cafe-300"></div>Empty</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-100 border border-orange-300"></div>Occupied</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Analytics (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
           {/* Revenue Card */}
           <div className="bg-gradient-to-r from-cafe-800 to-cafe-900 rounded-2xl p-8 text-white shadow-xl">
             <p className="text-cafe-300 text-sm font-medium uppercase tracking-wider mb-1">Total Revenue (Paid)</p>
             <h2 className="text-5xl font-bold">₹{totalRevenue.toFixed(0)}</h2>
           </div>

           {/* Charts Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Pie Chart: Popular Items */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-cafe-200 h-80">
                <h3 className="font-bold text-cafe-800 mb-4">Top Selling Items</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

               {/* Bar Chart: Daily Stats (Mock) */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-cafe-200 h-80">
                <h3 className="font-bold text-cafe-800 mb-4">Hourly Orders</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    {name: '10am', orders: 4},
                    {name: '12pm', orders: 12},
                    {name: '2pm', orders: 8},
                    {name: '4pm', orders: 15},
                    {name: '6pm', orders: 10},
                  ]}>
                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f5f5f4'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="orders" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           {/* 📅 Calendar Heatmap - Daily Order Volume */}
           <CalendarHeatmap orders={orders} />
        </div>
      </div>
    </Layout>
  );
};