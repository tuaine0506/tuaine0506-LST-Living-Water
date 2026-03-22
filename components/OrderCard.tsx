import React, { useState } from 'react';
import { Order, OrderSize } from '../types';
import { format } from 'date-fns';
import { 
  Edit2, Mail, Phone, Truck, Package, MapPin, DollarSign, 
  RefreshCw, CheckCircle2, Heart, Check, X, ChevronDown, ChevronUp, 
  Eye, ShoppingBag
} from 'lucide-react';

import { RecurringScheduleVisual } from './RecurringScheduleVisual';

interface OrderCardProps {
  order: Order;
  isFulfilledView?: boolean;
  onEdit: (order: Order) => void;
  onStatusToggle: (order: Order) => void;
  onRecurringWeekToggle?: (order: Order, weekIndex: number) => void;
  getMissingIngredients?: (productId: string) => string[];
  initiallyExpanded?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  isFulfilledView = false, 
  onEdit, 
  onStatusToggle, 
  onRecurringWeekToggle,
  getMissingIngredients,
  initiallyExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className={`p-4 rounded-lg shadow-md ${isFulfilledView ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} border flex flex-col justify-between relative transition-all duration-200`}>
      {/* Top right Edit button (icon only) */}
      {!isFulfilledView && (
        <button 
          onClick={() => onEdit(order)}
          className="absolute top-2 right-2 p-1.5 text-brand-green hover:bg-brand-cream rounded-md transition-colors"
          title="Edit Order"
        >
          <Edit2 size={16} />
        </button>
      )}

      <div>
        <div className="flex justify-between items-start">
          <div className="pr-6">
            <p className="font-bold text-brand-green">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerContact}</p>
            {order.customerEmail && (
               <p className="text-xs text-brand-orange flex items-center gap-1 mt-0.5 font-medium truncate">
                <Mail size={12} /> {order.customerEmail}
               </p>
            )}
            <p className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-2">#{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-brand-orange">${order.totalPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</p>
          </div>
        </div>

        {/* Expandable Section */}
        <div className={`mt-2 space-y-2 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="text-xs text-gray-500 border-t pt-2">
            Zelle Conf #: <span className="font-medium text-gray-700">{order.zelleConfirmationNumber}</span>
          </div>
          
          <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                  <div className={`inline-flex items-center gap-2 text-sm font-semibold px-2 py-1 rounded-full ${order.deliveryOption === 'Delivery' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {order.deliveryOption === 'Delivery' ? <Truck size={14} /> : <Package size={14} />}
                      {order.deliveryOption}
                  </div>
                   {order.isRecurring && (
                      <div className="inline-flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-800">
                          <RefreshCw size={14} /> Recurring
                      </div>
                   )}
              </div>

            {order.deliveryOption === 'Delivery' && order.deliveryAddress && (
              <p className="text-xs text-gray-600 pl-1 border-l-2 ml-1">{order.deliveryAddress}</p>
            )}
          </div>
          
          <div className="mt-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Details</p>
            {order.items.map((item, index) => {
              const missing = getMissingIngredients ? getMissingIngredients(item.productId) : [];
              return (
                <div key={index} className={`p-2 rounded-lg border ${missing.length > 0 ? 'bg-red-50 border-red-200' : 'bg-brand-cream/10 border-brand-cream/20'}`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-brand-brown">{item.quantity}x {item.productName}</span>
                    <span className="text-[10px] bg-white px-1.5 rounded border">7PK</span>
                  </div>
                  {missing.length > 0 && (
                    <p className="text-[9px] text-red-600 font-bold mt-1 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                      Missing: {missing.join(', ')}
                    </p>
                  )}
                  {item.selectedOptionalIngredients && item.selectedOptionalIngredients.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.selectedOptionalIngredients.map((opt, i) => (
                        <span key={i} className="flex items-center gap-0.5 text-[9px] bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded-full border border-brand-orange/20 font-bold">
                           <CheckCircle2 size={10} /> {opt.replace(/\s*\(optional\)\s*/i, '').trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {order.donationAmount > 0 && (
              <div className="text-brand-orange font-bold text-xs flex items-center gap-1 mt-1 bg-brand-orange/5 p-2 rounded-lg border border-brand-orange/10">
                  <Heart size={14} /> Donation: ${order.donationAmount.toFixed(2)}
              </div>
            )}
          </div>

          {order.isRecurring && (
            <div className="mt-4">
                <RecurringScheduleVisual 
                    order={order}
                    onToggle={onRecurringWeekToggle}
                    disabled={isFulfilledView}
                />
                
                {isFulfilledView && onRecurringWeekToggle && (
                     <button
                        onClick={() => onStatusToggle(order)}
                        className="w-full mt-3 py-2 px-4 rounded-lg font-bold text-xs text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 flex items-center justify-center transition-colors shadow-sm"
                    >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reset to Active
                    </button>
                )}
            </div>
          )}
        </div>
      </div>

      
      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        <div className="flex gap-2">
          {!isFulfilledView && (
            <button
              onClick={() => onEdit(order)}
              className="flex-1 py-2 px-3 rounded-lg font-semibold text-brand-green bg-brand-cream/30 hover:bg-brand-cream/50 border border-brand-green/20 flex items-center justify-center transition-colors text-xs"
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button
            onClick={toggleExpand}
            className="flex-1 py-2 px-3 rounded-lg font-semibold text-brand-brown bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center transition-colors text-xs"
          >
            {isExpanded ? (
              <><ChevronUp className="mr-1.5 h-3.5 w-3.5" /> Hide Details</>
            ) : (
              <><Eye className="mr-1.5 h-3.5 w-3.5" /> View Details</>
            )}
          </button>
        </div>

        {(!order.isRecurring || !onRecurringWeekToggle || isFulfilledView) && (
          <button
            onClick={() => onStatusToggle(order)}
            className={`w-full py-2 px-4 rounded-lg font-semibold text-white flex items-center justify-center transition-colors ${
              isFulfilledView ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isFulfilledView ? (
              <><X className="mr-2 h-4 w-4" />Mark as Unfulfilled</>
            ) : (
              <><Check className="mr-2 h-4 w-4" />Mark as Fulfilled</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
