import React, { useState } from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { X, Copy, Mail, MessageSquare, Phone, ExternalLink, Clock } from 'lucide-react';

interface NotificationModalProps {
  order: Order | null;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ order, onClose }) => {
  const { updateOrder } = useApp();
  const [deliveryWindow, setDeliveryWindow] = useState(order?.deliveryWindow || '10:00 AM - 12:00 PM');
  
  if (!order) return null;

  const pickupMessage = `Hello ${order.customerName},\n\nYour 'Living Water' wellness shot order is ready for pickup! You can pick it up this Sunday at the La Sierra Tongan SDA Fellowship.\n\nThank you for your support!`;
  
  const deliveryMessage = `Hello ${order.customerName},\n\nYour 'Living Water' wellness shot order is fulfilled! It will be delivered this Sunday within a 2-4 hour window (approx. ${deliveryWindow}) to:\n${order.deliveryAddress}\n\nWe will notify you when our driver is nearby. Thank you for your support!`;

  const message = order.deliveryOption === 'Pickup' ? pickupMessage : deliveryMessage;

  const saveAndCopy = () => {
    if (order.deliveryOption === 'Delivery') {
      updateOrder(order.id, { deliveryWindow });
    }
    navigator.clipboard.writeText(message);
    alert('Message copied to clipboard and delivery window saved!');
  };

  const getSmsLink = () => {
    if (order.deliveryOption === 'Delivery') {
      updateOrder(order.id, { deliveryWindow });
    }
    const phone = order.customerContact.replace(/[^\d]/g, '');
    return `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const getEmailLink = () => {
    if (order.deliveryOption === 'Delivery') {
      updateOrder(order.id, { deliveryWindow });
    }
    return `mailto:${order.customerEmail}?subject=${encodeURIComponent('Living Water Order Ready')}&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-brand-light-green">
        <div className="bg-brand-green p-4 flex justify-between items-center text-white">
          <h3 className="text-xl font-bold font-serif">Notify Customer</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-extrabold text-brand-brown uppercase tracking-widest">Customer Details</p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <p className="font-bold text-brand-green text-lg">{order.customerName}</p>
                <div className="flex flex-wrap gap-4 items-center text-sm">
                    <div className="flex items-center gap-2 text-brand-brown">
                        <Phone size={16} className="text-brand-orange" />
                        <span className="font-mono">{order.customerContact}</span>
                    </div>
                    {order.customerEmail && (
                        <div className="flex items-center gap-2 text-brand-brown">
                            <Mail size={16} className="text-brand-orange" />
                            <span className="font-mono">{order.customerEmail}</span>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {order.deliveryOption === 'Delivery' && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-brand-brown uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-brand-orange" /> Set Delivery Window
              </label>
              <select 
                value={deliveryWindow}
                onChange={(e) => setDeliveryWindow(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-brand-orange outline-none"
              >
                <option value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</option>
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</option>
                <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-extrabold text-brand-brown uppercase tracking-widest">Message Preview</p>
            <textarea
              readOnly
              value={message}
              className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 h-40 focus:ring-2 focus:ring-brand-orange outline-none text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button
                onClick={() => window.open(getSmsLink())}
                className="flex items-center justify-center gap-2 bg-brand-green text-white font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-95"
            >
                <MessageSquare size={18} /> Send SMS
            </button>
            {order.customerEmail && (
                 <button
                    onClick={() => window.open(getEmailLink())}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-95"
                >
                    <Mail size={18} /> Send Email
                </button>
            )}
            <button
                onClick={saveAndCopy}
                className="flex items-center justify-center gap-2 bg-brand-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-95 sm:col-span-full"
            >
                <Copy size={18} /> Copy to Clipboard
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-center">
            <button
                onClick={onClose}
                className="text-gray-500 font-bold text-sm hover:text-brand-brown py-2 transition-colors"
            >
                Done / Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;