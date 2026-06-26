import React from 'react';
import { useCafe } from '../store/CafeContext';
import { Layout } from '../components/Layout';
import { UserRole, OrderStatus } from '../types';
import { Clock, CheckCircle, ChefHat, PlayCircle } from 'lucide-react';

export const KitchenDashboard: React.FC = () => {
  const { orders, updateOrderStatus } = useCafe();

  // Filter out completed orders to keep view clean
  const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED).sort((a, b) => a.timestamp - b.timestamp);

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    return `${minutes}m ago`;
  };

  return (
    <Layout role={UserRole.KITCHEN} title="Live Orders">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.length === 0 ? (
           <div className="col-span-full flex flex-col items-center justify-center h-64 text-cafe-400">
             <ChefHat size={64} className="mb-4 opacity-20" />
             <p>No active orders. Kitchen is clear!</p>
           </div>
        ) : activeOrders.map(order => (
          <div 
            key={order.id} 
            className={`bg-white rounded-2xl shadow-sm border-l-8 overflow-hidden transition-all duration-300 flex flex-col
              ${order.status === OrderStatus.PENDING ? 'border-l-stone-400' : 
                order.status === OrderStatus.PREPARING ? 'border-l-brand-orange' : 'border-l-green-500'}`}
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-cafe-800">Table {order.tableId}</h3>
                  <span className="text-xs text-cafe-400 font-mono">#{order.id.slice(-4)}</span>
                </div>
                <div className="flex items-center text-cafe-500 text-sm font-medium bg-cafe-50 px-2 py-1 rounded-md">
                  <Clock size={14} className="mr-1" />
                  {formatTime(order.timestamp)}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-cafe-50 pb-2 last:border-0">
                    <div className="flex items-center">
                      <span className="bg-cafe-100 w-6 h-6 rounded flex items-center justify-center text-xs font-bold mr-3 text-cafe-800">
                        {item.quantity}x
                      </span>
                      <span className="text-cafe-700 font-medium">{item.name}</span>
                    </div>
                    {item.quantity > 1 && <span className="text-xs text-brand-orange font-bold font-mono">Top priority</span>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 pt-0 mt-auto">
              <div className="grid grid-cols-1 gap-3">
                 {order.status === OrderStatus.PENDING && (
                   <button 
                     onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                     className="w-full bg-brand-orange text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-orange-600 transition-colors"
                   >
                     <PlayCircle className="mr-2" size={18} /> Start Cooking
                   </button>
                 )}
                 
                 {order.status === OrderStatus.PREPARING && (
                   <button 
                     onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                     className="w-full bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-green-600 transition-colors animate-pulse"
                   >
                     <CheckCircle className="mr-2" size={18} /> Mark Ready
                   </button>
                 )}

                 {order.status === OrderStatus.READY && (
                   <div className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center border border-green-200">
                     <CheckCircle className="mr-2" size={18} /> Ready for Server
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};