import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Filter, CheckCircle, Clock, ChevronDown, ChevronUp, Package, Truck, DollarSign, Calendar, Mail, Phone, MapPin, User, RefreshCw, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { Order } from '../types';
import OrderCard from '../components/OrderCard';
import EditOrderModal from '../components/EditOrderModal';
import { RecurringScheduleVisual } from '../components/RecurringScheduleVisual';

const AdminOrdersPage: React.FC = () => {
  const { orders, updateOrder, toggleOrderFulfilled } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fulfilled'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'pending' ? !order.isFulfilled :
        order.isFulfilled;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, searchTerm, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleStatusToggle = (order: Order) => {
    toggleOrderFulfilled(order.id);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-green font-serif">Order Management</h1>
          <p className="text-brand-brown">View and manage all fundraiser orders.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-brand-light-green/30 shadow-sm self-start md:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-bold transition-colors ${statusFilter === 'all' ? 'bg-brand-green text-white' : 'text-brand-brown hover:bg-brand-light-green/10'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-bold transition-colors ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-brand-brown hover:bg-brand-light-green/10'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('fulfilled')}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-bold transition-colors ${statusFilter === 'fulfilled' ? 'bg-green-600 text-white' : 'text-brand-brown hover:bg-brand-light-green/10'}`}
          >
            Fulfilled
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/50" size={20} />
        <input
          type="text"
          placeholder="Search by name, email, or order #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-light-green focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all shadow-sm"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-brand-brown/60 italic bg-white rounded-2xl border border-brand-light-green/20">
            No orders found matching your criteria.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard 
              key={order.id}
              order={order}
              isFulfilledView={order.isFulfilled}
              onEdit={setEditingOrder}
              onStatusToggle={handleStatusToggle}
            />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-md border border-brand-light-green/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-cream/30 border-b border-brand-light-green/20 text-brand-brown text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Order #</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light-green/10">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brand-brown/60 italic">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      onClick={() => toggleExpand(order.id)}
                      className={`hover:bg-brand-light-green/5 cursor-pointer transition-colors ${expandedOrderId === order.id ? 'bg-brand-light-green/5' : ''}`}
                    >
                      <td className="p-4 font-mono font-bold text-brand-green">{order.orderNumber}</td>
                      <td className="p-4 text-sm text-brand-brown">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</td>
                      <td className="p-4">
                        <div className="font-bold text-brand-brown">{order.customerName}</div>
                        <div className="text-xs text-brand-brown/60">{order.customerEmail}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-brand-green">${order.totalPrice.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          order.isFulfilled 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {order.isFulfilled ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {order.isFulfilled ? 'Fulfilled' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOrder(order);
                            }}
                            className="p-2 rounded-full text-brand-green hover:bg-brand-light-green/10 transition-colors"
                            title="Edit Order"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusToggle(order);
                            }}
                            className={`p-2 rounded-full transition-colors ${
                              order.isFulfilled 
                                ? 'text-green-600 hover:bg-green-100' 
                                : 'text-amber-500 hover:bg-amber-100'
                            }`}
                            title={order.isFulfilled ? "Mark as Pending" : "Mark as Fulfilled"}
                          >
                            {order.isFulfilled ? <CheckCircle size={20} /> : <Clock size={20} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="bg-brand-light-green/5">
                        <td colSpan={6} className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-4">
                              <h3 className="font-bold text-brand-green flex items-center gap-2 border-b border-brand-light-green/20 pb-2">
                                <Package size={18} /> Order Items
                              </h3>
                              <ul className="space-y-3">
                                {order.items.map((item, idx) => (
                                  <li key={idx} className="flex justify-between text-sm bg-white p-3 rounded-lg border border-brand-light-green/10 shadow-sm">
                                    <div>
                                      <span className="font-bold text-brand-brown">{item.quantity}x {item.productName}</span>
                                      <span className="block text-xs text-brand-brown/60">{item.size}</span>
                                      {item.selectedOptionalIngredients && item.selectedOptionalIngredients.length > 0 && (
                                        <span className="block text-[10px] text-brand-brown/60 italic mt-1">
                                          + {item.selectedOptionalIngredients.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono font-bold text-brand-green">
                                      ${(item.quantity * 35).toFixed(2)}
                                    </span>
                                  </li>
                                ))}
                                {order.donationAmount > 0 && (
                                  <li className="flex justify-between text-sm bg-white p-3 rounded-lg border border-brand-light-green/10 shadow-sm border-l-4 border-l-brand-orange">
                                    <span className="font-bold text-brand-brown italic">Donation</span>
                                    <span className="font-mono font-bold text-brand-green">${order.donationAmount.toFixed(2)}</span>
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div className="space-y-4">
                              <h3 className="font-bold text-brand-green flex items-center gap-2 border-b border-brand-light-green/20 pb-2">
                                <User size={18} /> Customer & Delivery
                              </h3>
                              <div className="bg-white p-4 rounded-xl border border-brand-light-green/10 shadow-sm space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                  <Mail size={16} className="text-brand-brown/40 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-brand-brown/60 uppercase">Email</p>
                                    <p className="font-medium text-brand-brown">{order.customerEmail || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Phone size={16} className="text-brand-brown/40 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-brand-brown/60 uppercase">Phone</p>
                                    <p className="font-medium text-brand-brown">{order.customerContact}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Truck size={16} className="text-brand-brown/40 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-brand-brown/60 uppercase">Delivery Method</p>
                                    <p className="font-bold text-brand-brown">{order.deliveryOption}</p>
                                  </div>
                                </div>
                                {order.deliveryAddress && (
                                  <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-brand-brown/40 mt-0.5" />
                                    <div>
                                      <p className="text-xs text-brand-brown/60 uppercase">Address</p>
                                      <p className="font-medium text-brand-brown">{order.deliveryAddress}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-start gap-3 pt-2 border-t border-dashed border-gray-100">
                                  <DollarSign size={16} className="text-brand-brown/40 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-brand-brown/60 uppercase">Zelle Confirmation</p>
                                    <p className="font-mono font-bold text-brand-orange">{order.zelleConfirmationNumber}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {order.isRecurring && <RecurringScheduleVisual order={order} />}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Edit Order Modal */}
      <EditOrderModal 
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
      />
    </div>
  );
};

export default AdminOrdersPage;
