import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Phone, Clock, User, Package, CheckCircle2, Navigation } from 'lucide-react';

const DeliveriesPage: React.FC = () => {
  const { orders } = useApp();

  const deliveryOrders = useMemo(() => {
    return orders
      .filter(order => order.deliveryOption === 'Delivery')
      .sort((a, b) => {
        const timeA = a.deliveryWindow || '99:99';
        const timeB = b.deliveryWindow || '99:99';
        return timeA.localeCompare(timeB);
      });
  }, [orders]);

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-shadow-sm">Delivery Schedule</h1>
        <p className="text-brand-brown mt-2 max-w-2xl mx-auto font-medium">
          Route plan and schedule for Sunday wellness shot deliveries.
        </p>
      </div>

      {deliveryOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-brand-light-green/20 text-center space-y-4">
           <Navigation size={48} className="mx-auto text-gray-300" />
           <p className="text-gray-500 font-medium">No delivery orders have been placed for this batch yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-brand-orange/10 p-4 rounded-2xl border border-brand-orange/20 flex items-center justify-between">
            <p className="text-sm font-bold text-brand-orange uppercase tracking-widest">Active Deliveries: {deliveryOrders.length}</p>
            <div className="flex gap-2">
               <button onClick={() => window.print()} className="text-[10px] bg-white px-3 py-1 rounded-full border font-bold text-brand-green hover:bg-gray-50">
                 Print Route Sheet
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {deliveryOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-brand-light-green/10 overflow-hidden hover:border-brand-orange transition-all group">
                <div className="flex flex-col md:flex-row">
                  {/* Timeline/Time Section */}
                  <div className={`p-6 flex flex-col justify-center items-center text-center md:w-48 ${order.isFulfilled ? 'bg-green-50' : 'bg-brand-cream/10'}`}>
                    <Clock size={24} className={order.deliveryWindow ? 'text-brand-orange' : 'text-gray-300'} />
                    <p className="mt-2 text-sm font-bold text-brand-brown">
                      {order.deliveryWindow || 'Unscheduled'}
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                       {order.isFulfilled ? (
                         <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">READY</span>
                       ) : (
                         <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-bold">PREPARING</span>
                       )}
                    </div>
                  </div>

                  {/* Main Content Section */}
                  <div className="p-6 flex-grow space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <User size={18} className="text-brand-green" />
                           <h3 className="text-lg font-bold text-brand-green font-serif">{order.customerName}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-brand-brown font-medium">
                           <Phone size={14} className="text-brand-orange" />
                           {order.customerContact}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex-grow max-w-md">
                        <div className="flex items-start gap-2">
                           <MapPin size={18} className="text-brand-orange shrink-0 mt-0.5" />
                           <p className="text-sm font-bold text-brand-brown leading-tight">
                             {order.deliveryAddress}
                           </p>
                        </div>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-green uppercase tracking-wide hover:underline"
                        >
                          <Navigation size={12} /> Open in Maps
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex flex-wrap gap-3 items-center">
                       <div className="flex items-center gap-1.5 text-xs text-gray-500">
                         <Package size={14} /> 
                         <span className="font-bold">{order.items.reduce((sum, i) => sum + i.quantity, 0)} Items</span>
                       </div>
                       <div className="flex flex-wrap gap-1.5">
                         {order.items.map((item, idx) => (
                           <span key={idx} className="text-[9px] bg-brand-cream/30 px-2 py-0.5 rounded-md font-bold text-brand-brown">
                             {item.quantity}x {item.productName.split(' ')[0]}
                           </span>
                         ))}
                       </div>
                       <div className="ml-auto">
                         <p className="text-[10px] text-gray-400 font-mono">ID: #{order.orderNumber}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveriesPage;