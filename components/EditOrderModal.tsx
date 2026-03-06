import React, { useState, useEffect } from 'react';
import { Order, OrderSize, DeliveryOption, CartItem, ProductPrices } from '../types';
import { useApp } from '../context/AppContext';
import { X, Save, Trash2, PlusCircle, Calendar as CalendarIcon, ShieldCheck } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { MiniCalendar } from './MiniCalendar';

interface EditOrderModalProps {
  order: Order | null;
  onClose: () => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose }) => {
  const { updateOrder } = useApp();
  const [formData, setFormData] = useState<Partial<Order>>({});
  
  // Local state for address parsing/editing
  const [addressParts, setAddressParts] = useState({
    street: '',
    city: '',
    state: '',
    zip: ''
  });
  const [allowAnyDay, setAllowAnyDay] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({ ...order });
      
      // Attempt to parse existing address string
      if (order.deliveryAddress) {
        const parts = order.deliveryAddress.split(', ');
        const stateZip = parts[2]?.split(' ') || ['', ''];
        setAddressParts({
          street: parts[0] || '',
          city: parts[1] || '',
          state: stateZip[0] || '',
          zip: stateZip[1] || ''
        });
      } else {
        setAddressParts({ street: '', city: '', state: '', zip: '' });
      }
    }
  }, [order]);

  if (!order) return null;

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'customerContact') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newParts = { ...addressParts, [name]: value };
    setAddressParts(newParts);
    setFormData(prev => ({
      ...prev,
      deliveryAddress: `${newParts.street}, ${newParts.city}, ${newParts.state} ${newParts.zip}`
    }));
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    if (!formData.items) return;
    const newItems = [...formData.items];
    if (quantity <= 0) {
      newItems.splice(index, 1);
    } else {
      newItems[index] = { ...newItems[index], quantity };
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const newItem: CartItem = {
      productId,
      productName: product.name,
      size: OrderSize.SevenShots,
      quantity: 1
    };
    setFormData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const handleSave = () => {
    if (order.id && formData.items) {
      const productPrice = formData.isRecurring 
        ? formData.items.reduce((acc, item) => acc + 120 * item.quantity, 0)
        : formData.items.reduce((acc, item) => acc + ProductPrices[item.size] * item.quantity, 0);
      
      const finalPrice = productPrice + (formData.donationAmount || 0);
      
      updateOrder(order.id, { ...formData, totalPrice: finalPrice });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-brand-light-green flex flex-col">
        <div className="bg-brand-green p-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif">Edit Order #{order.orderNumber}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-brown uppercase mb-1">Customer Name</label>
              <input 
                type="text" 
                name="customerName" 
                value={formData.customerName || ''} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-brown uppercase mb-1">Phone Contact</label>
              <input 
                type="text" 
                name="customerContact" 
                value={formData.customerContact || ''} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-brand-brown uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              name="customerEmail" 
              value={formData.customerEmail || ''} 
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
              placeholder="customer@example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-brown uppercase mb-1">Zelle Confirmation</label>
              <input 
                type="text" 
                name="zelleConfirmationNumber" 
                value={formData.zelleConfirmationNumber || ''} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-brown uppercase mb-1">Donation Amount ($)</label>
              <input 
                type="number" 
                name="donationAmount" 
                value={isNaN(formData.donationAmount as number) ? '' : formData.donationAmount} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData(prev => ({ ...prev, donationAmount: isNaN(val) ? 0 : val }));
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-brown uppercase mb-1">Delivery Option</label>
            <select 
              name="deliveryOption" 
              value={formData.deliveryOption || 'Pickup'} 
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
            >
              <option value="Pickup">Pickup</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>

          {formData.deliveryOption === 'Delivery' && (
            <div className="space-y-2 border-l-2 border-brand-orange pl-3">
              <label className="block text-xs font-bold text-brand-brown uppercase mb-1">Delivery Address</label>
              <input 
                type="text" 
                name="street" 
                placeholder="Street Address"
                value={addressParts.street} 
                onChange={handleAddressChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 <input 
                    type="text" 
                    name="city" 
                    placeholder="City"
                    value={addressParts.city} 
                    onChange={handleAddressChange}
                    className="md:col-span-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
                />
                <input 
                    type="text" 
                    name="state" 
                    placeholder="State"
                    value={addressParts.state} 
                    onChange={handleAddressChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
                />
                <input 
                    type="text" 
                    name="zip" 
                    placeholder="Zip"
                    value={addressParts.zip} 
                    onChange={handleAddressChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-orange outline-none bg-white"
                />
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-bold text-brand-green mb-3 flex items-center justify-between">
              Order Items
              <div className="relative group">
                 <button className="text-xs bg-brand-light-green text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-brand-green transition-colors">
                    <PlusCircle size={14} /> Add Product
                 </button>
                 <div className="absolute right-0 top-full mt-1 bg-white border shadow-xl rounded-lg py-1 w-48 hidden group-hover:block z-10">
                    {PRODUCTS.map(p => (
                        <button 
                            key={p.id} 
                            onClick={() => addItem(p.id)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-cream text-brand-brown"
                        >
                            {p.name}
                        </button>
                    ))}
                 </div>
              </div>
            </h3>
            <div className="space-y-2">
              {formData.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border">
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-brand-brown">{item.productName}</p>
                    <select 
                        value={item.size} 
                        onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[idx] = { ...newItems[idx], size: e.target.value as OrderSize };
                            setFormData(prev => ({ ...prev, items: newItems }));
                        }}
                        className="text-[10px] p-1 border rounded bg-white"
                    >
                        <option value={OrderSize.SevenShots}>7-Pack</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={item.quantity} 
                      onChange={(e) => handleItemQuantityChange(idx, parseInt(e.target.value))}
                      className="w-14 p-1 border rounded text-center text-xs bg-white"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <button onClick={() => handleItemQuantityChange(idx, 0)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {(!formData.items || formData.items.length === 0) && (
                <p className="text-xs text-gray-500 italic">No items in this order.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isRecurring" 
                checked={formData.isRecurring || false} 
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-brand-orange bg-white"
              />
              <label htmlFor="isRecurring" className="text-xs font-bold text-brand-brown cursor-pointer">Recurring Order ($120 bundle)</label>
            </div>

            {formData.isRecurring && (
              <div className="bg-brand-green/5 p-4 rounded-xl border border-brand-green/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="text-brand-green" size={16} />
                    <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Scheduled Pickup Dates</p>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={allowAnyDay} 
                      onChange={(e) => setAllowAnyDay(e.target.checked)}
                      className="h-3 w-3 rounded border-gray-300 text-brand-green focus:ring-brand-green bg-white"
                    />
                    <span className="text-[9px] font-bold text-gray-400 group-hover:text-brand-green transition-colors flex items-center gap-1">
                      <ShieldCheck size={10} /> Admin Bypass
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(formData.recurringDates || []).map((date, idx) => (
                    <MiniCalendar 
                      key={idx}
                      selectedDate={date}
                      onSelect={(newDate) => {
                        const newDates = [...(formData.recurringDates || [])];
                        newDates[idx] = newDate;
                        
                        // Automatically recalculate subsequent weeks
                        let currentD = new Date(newDate + 'T12:00:00');
                        for (let i = idx + 1; i < newDates.length; i++) {
                          currentD.setDate(currentD.getDate() + 7);
                          newDates[i] = currentD.toISOString().split('T')[0];
                        }
                        
                        setFormData(prev => ({ ...prev, recurringDates: newDates }));
                      }}
                      weekLabel={`Week ${idx + 1}`}
                      allowAnyDay={allowAnyDay}
                    />
                  ))}
                  {(!formData.recurringDates || formData.recurringDates.length === 0) && (
                    <button 
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + (7 - d.getDay()) % 7);
                        const dates: string[] = [];
                        for(let i=0; i<4; i++) {
                          dates.push(new Date(d).toISOString().split('T')[0]);
                          d.setDate(d.getDate() + 7);
                        }
                        setFormData(prev => ({ ...prev, recurringDates: dates }));
                      }}
                      className="col-span-full text-[10px] bg-brand-orange text-white py-2 rounded-lg font-bold shadow-sm"
                    >
                      Generate Default Dates
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-brand-brown transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 shadow-md active:scale-95 transition-all"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;