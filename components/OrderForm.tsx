import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductPrices, DeliveryOption, OrderSize, GroupName, DonationTier } from '../types';
import { X, Trash2, Heart, AlertTriangle, ShoppingCart, Send, PackageCheck, Truck, Plus, Minus, Calendar, Clock, Edit2, User, Gift } from 'lucide-react';
import { MiniCalendar } from './MiniCalendar';
import { DONATION_TIERS } from '../constants';

const OrderForm: React.FC = () => {
  const { cart, cartId, donationAmount, setDonationAmount, removeFromCart, updateCartQuantity, placeOrder, clearCart, products, ingredients: allIngredients, isDeliveryEnabled, volunteers } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('Pickup');
  
  // Sponsorship state
  const [sponsorshipGroup, setSponsorshipGroup] = useState<GroupName | 'General'>('General');
  const [selectedYouthId, setSelectedYouthId] = useState<string>('');
  const [youthSearch, setYouthSearch] = useState('');

  const isIngredientAvailable = (name: string) => {
    const cleanName = name.replace(/\s*\(optional\)\s*/i, '').trim();
    const ingredient = allIngredients.find(i => i.name === cleanName || i.name === name);
    return ingredient ? ingredient.available : true;
  };

  const getMissingIngredients = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    return product.ingredients.filter(ing => !isIngredientAvailable(ing) && !ing.toLowerCase().includes('(optional)'));
  };

  const cartHasMissingIngredients = cart.some(item => getMissingIngredients(item.productId).length > 0);
  
  // Split address state
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');

  const [zelleChecked, setZelleChecked] = useState(false);
  const [zelleConfirmation, setZelleConfirmation] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDates, setRecurringDates] = useState<string[]>([]);

  React.useEffect(() => {
    if (!isDeliveryEnabled && !isRecurring && deliveryOption === 'Delivery') {
      setDeliveryOption('Pickup');
    }
  }, [isDeliveryEnabled, deliveryOption, isRecurring]);

  const getInitialRecurringDates = () => {
    const dates = [];
    const now = new Date();
    // Create a date object for today at local midnight to avoid time-of-day issues
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Add 2 days for preparation buffer (e.g., if today is Friday, Sunday is the earliest available)
    d.setDate(d.getDate() + 2);
    
    // Find the next Sunday (0)
    while (d.getDay() !== 0) {
      d.setDate(d.getDate() + 1);
    }
    
    for (let i = 0; i < 4; i++) {
      // Format as YYYY-MM-DD using local time
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      
      d.setDate(d.getDate() + 7);
    }
    return dates;
  };

  React.useEffect(() => {
    if (isRecurring) {
      if (recurringDates.length === 0) {
        setRecurringDates(getInitialRecurringDates());
      }
    } else {
      setRecurringDates([]);
    }
  }, [isRecurring]);

  const handleRecurringDateChange = (index: number, newDate: string) => {
    const newDates = [...recurringDates];
    newDates[index] = newDate;
    
    // Automatically recalculate subsequent weeks
    let currentD = new Date(newDate + 'T12:00:00');
    const interval = 7;
    for (let i = index + 1; i < newDates.length; i++) {
      currentD.setDate(currentD.getDate() + interval);
      
      const year = currentD.getFullYear();
      const month = String(currentD.getMonth() + 1).padStart(2, '0');
      const day = String(currentD.getDate()).padStart(2, '0');
      newDates[i] = `${year}-${month}-${day}`;
    }
    
    setRecurringDates(newDates);
  };
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{ deliveryOption: DeliveryOption } | null>(null);

  const cartTotal = cart.reduce((acc, item) => {
    return acc + ProductPrices[item.size] * item.quantity;
  }, 0);
  
  const productPrice = isRecurring 
    ? cart.reduce((acc, item) => acc + 120 * item.quantity, 0) 
    : cartTotal;
  const displayTotal = productPrice + donationAmount;

  // Phone number formatter: (xxx) xxx-xxxx
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    const length = digits.length;

    if (length <= 3) return digits;
    if (length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setCustomerContact(formattedValue);
  };

  const canPlaceOrder = (cart.length > 0 || donationAmount > 0) && 
                        customerName && 
                        customerContact.length >= 14 && // (xxx) xxx-xxxx is 14 chars
                        zelleConfirmation && 
                        zelleChecked && 
                        (deliveryOption === 'Pickup' || (deliveryOption === 'Delivery' && addressStreet && addressCity && addressState && addressZip)) &&
                        (!isRecurring || (isRecurring));

  React.useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      if (profile.name) setCustomerName(profile.name);
      if (profile.phone) setCustomerContact(profile.phone);
      if (profile.email) setCustomerEmail(profile.email);
      if (profile.address) {
        const parts = profile.address.split(', ');
        if (parts.length >= 1) setAddressStreet(parts[0]);
        if (parts.length >= 2) setAddressCity(parts[1]);
        if (parts.length >= 3) {
          const stateZip = parts[2].split(' ');
          if (stateZip.length >= 1) setAddressState(stateZip[0]);
          if (stateZip.length >= 2) setAddressZip(stateZip[1]);
        }
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlaceOrder) {
      alert('Please fill out all required fields correctly.');
      return;
    }

    const fullAddress = deliveryOption === 'Delivery' 
      ? `${addressStreet}, ${addressCity}, ${addressState} ${addressZip}`
      : undefined;

    // Save to profile for future use
    const profile = {
      name: customerName,
      email: customerEmail,
      phone: customerContact,
      address: fullAddress || ''
    };
    localStorage.setItem('user_profile', JSON.stringify(profile));

    setLastOrderDetails({ deliveryOption });
    const selectedYouth = volunteers.find(v => v.id === selectedYouthId);
    
    placeOrder(
      customerName, 
      customerContact, 
      customerEmail, 
      deliveryOption, 
      fullAddress, 
      zelleConfirmation, 
      isRecurring, 
      isRecurring ? recurringDates : undefined,
      selectedYouthId || undefined,
      selectedYouth?.name
    );
    
    // Reset form
    setCustomerName('');
    setCustomerContact('');
    setCustomerEmail('');
    setDeliveryOption('Pickup');
    setAddressStreet('');
    setAddressCity('');
    setAddressState('');
    setAddressZip('');
    setZelleChecked(false);
    setZelleConfirmation('');
    setIsRecurring(false);
    setSponsorshipGroup('General');
    setSelectedYouthId('');
    setYouthSearch('');
    setIsSubmitted(true);
  };

  if (isSubmitted && lastOrderDetails) {
    return (
      <div className="text-center p-8 bg-green-50 rounded-lg">
        <h3 className="text-2xl font-bold text-green-700">Thank You!</h3>
        <p className="mt-2 text-green-600">
          Your order has been placed successfully. We will contact you when it's ready for {lastOrderDetails.deliveryOption.toLowerCase()}.
        </p>
        <button 
          onClick={() => {
            setIsSubmitted(false);
            setLastOrderDetails(null);
          }}
          className="mt-4 bg-brand-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Empty State Message - Only show if cart is empty AND no donation */}
      {cart.length === 0 && donationAmount === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Your order is empty.</p>
          <p className="text-sm text-gray-400 mt-1">Add some wellness shots or a donation to support our Youth & Young Adults!</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Sponsorship - NEW */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="bg-brand-orange/5 px-4 py-3 border-b border-brand-orange/10 flex items-center gap-2">
            <User size={18} className="text-brand-orange" />
            <h3 className="font-bold text-brand-orange uppercase text-xs tracking-widest">Sponsor a Youth</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-brand-brown/70 leading-relaxed">
              Who are you supporting today? You can sponsor a specific youth or the general ministry fund.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSponsorshipGroup('General');
                  setSelectedYouthId('');
                }}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${sponsorshipGroup === 'General' ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-gray-100 text-brand-brown hover:border-brand-orange/30'}`}
              >
                General Fund
              </button>
              {Object.values(GroupName).map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => {
                    setSponsorshipGroup(group);
                    setSelectedYouthId('');
                    setYouthSearch('');
                  }}
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${sponsorshipGroup === group ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-gray-100 text-brand-brown hover:border-brand-orange/30'}`}
                >
                  {group.split('(')[0].trim()}
                </button>
              ))}
            </div>

            {sponsorshipGroup !== 'General' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search in ${sponsorshipGroup.split('(')[0].trim()}...`}
                    value={youthSearch}
                    onChange={(e) => setYouthSearch(e.target.value)}
                    className="w-full p-3 pl-9 border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all text-xs"
                  />
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="max-h-40 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                  {volunteers
                    .filter(v => v.group === sponsorshipGroup)
                    .filter(v => v.name.toLowerCase().includes(youthSearch.toLowerCase()))
                    .map(youth => (
                      <button
                        key={youth.id}
                        type="button"
                        onClick={() => setSelectedYouthId(youth.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectedYouthId === youth.id ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'hover:bg-gray-100 text-brand-brown'}`}
                      >
                        {youth.name}
                      </button>
                    ))}
                  {volunteers.filter(v => v.group === sponsorshipGroup).length === 0 && (
                    <p className="text-[10px] text-gray-400 text-center py-2 italic">No members found in this group yet.</p>
                  )}
                </div>
              </div>
            )}
            
            {selectedYouthId && (
              <div className="p-3 bg-brand-orange/5 border border-brand-orange/20 rounded-xl flex items-center justify-between animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-brand-orange" />
                  <p className="text-xs font-bold text-brand-brown">
                    Sponsoring: <span className="text-brand-orange">{volunteers.find(v => v.id === selectedYouthId)?.name}</span>
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedYouthId('')}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Your Selection - Only show if cart has items */}
        {cart.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="bg-brand-green/5 px-4 py-3 border-b border-brand-green/10 flex items-center gap-2">
              <ShoppingCart size={18} className="text-brand-green" />
              <h3 className="font-bold text-brand-green uppercase text-xs tracking-widest">Your Selection</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {cartHasMissingIngredients && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-red-800">
                    <p className="font-bold">Inventory Alert</p>
                    <p>Some items in your cart use ingredients currently out of stock. Fulfillment may be delayed.</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {cart.map(item => {
                  const missing = getMissingIngredients(item.productId);
                  const optionals = item.selectedOptionalIngredients || [];
                  
                  return (
                    <div key={`${item.productId}-${item.size}-${JSON.stringify(optionals)}`} className={`flex flex-col p-4 bg-gray-50/50 border rounded-xl transition-all ${missing.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-brand-light-green/50'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-brand-brown leading-tight">{item.productName}</p>
                            <span className="text-[10px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                              {item.size === OrderSize.SevenShots ? '7-Pack' : item.size}
                            </span>
                          </div>
                          
                          {optionals.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {optionals.map((opt, i) => (
                                <span key={i} className="text-[9px] bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded-full font-bold border border-brand-orange/20">
                                  + {opt.replace(/\s*\(optional\)\s*/i, '').trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {missing.length > 0 && (
                            <p className="text-[10px] text-red-500 font-bold mt-2 uppercase flex items-center gap-1.5">
                              <AlertTriangle size={10} />
                              Missing: {missing.join(', ')}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.productId, item.size, optionals, item.quantity - 1)}
                              className="p-1.5 hover:bg-gray-50 text-brand-brown transition-colors border-r border-gray-100"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-sm font-black text-brand-green min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.productId, item.size, optionals, item.quantity + 1)}
                              className="p-1.5 hover:bg-gray-50 text-brand-brown transition-colors border-l border-gray-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="text-sm font-black text-brand-green">
                            ${(ProductPrices[item.size] * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => removeFromCart(item.productId, item.size, optionals)} 
                          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                        >
                          <Trash2 size={12} /> Remove Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Recurring Option - Only show if cart has items */}
        {cart.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-brand-light-green/30 shadow-sm">
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-6 w-6 rounded-lg border-gray-300 text-brand-orange focus:ring-brand-orange bg-white transition-all cursor-pointer"
                  />
                </div>
                <div className="ml-4">
                  <span className="block text-sm font-bold text-brand-brown group-hover:text-brand-orange transition-colors">Recurring Order ($120 bundle)</span>
                  <span className="block text-xs text-gray-500 mt-0.5">4 weeks prepaid - <span className="text-brand-green font-bold">Best value for your health!</span></span>
                </div>
              </label>

              {isRecurring && (
                <div className="mt-4 pl-10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] text-gray-400 mt-2 italic">Recurring orders directly support our youth and young adults.</p>
                  
                  <div className="bg-brand-green/5 rounded-2xl p-5 border border-brand-green/10">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="text-brand-green" size={20} />
                      <h4 className="font-bold text-brand-green text-sm uppercase tracking-widest">Your 4-Week Schedule</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recurringDates.map((date, idx) => (
                        <MiniCalendar 
                          key={idx}
                          selectedDate={date}
                          onSelect={(newDate) => handleRecurringDateChange(idx, newDate)}
                          weekLabel={`Week ${idx + 1}`}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-white/50 rounded-xl border border-dashed border-brand-green/30">
                      <p className="text-[10px] text-brand-brown/70 leading-relaxed">
                        <span className="font-bold text-brand-green">Note:</span> You will receive your full cart selection (
                        {cart.map(item => `${item.quantity}x ${item.productName}`).join(', ')}
                        ) on each of these dates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Option moved here */}
              {cart.length > 0 && (isDeliveryEnabled || isRecurring) && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  <h4 className="text-[10px] font-black text-brand-green uppercase tracking-widest">Delivery Option</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex flex-col items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${deliveryOption === 'Pickup' ? 'bg-brand-green/5 border-brand-green' : 'bg-white border-gray-100 hover:border-brand-green/30'}`}>
                      <input type="radio" name="delivery" value="Pickup" checked={deliveryOption === 'Pickup'} onChange={() => setDeliveryOption('Pickup')} className="sr-only" />
                      <PackageCheck size={24} className={deliveryOption === 'Pickup' ? 'text-brand-green' : 'text-gray-300'} />
                      <span className={`mt-2 font-bold text-sm ${deliveryOption === 'Pickup' ? 'text-brand-green' : 'text-gray-500'}`}>Pickup</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">At LSU Church</span>
                    </label>
                    <label className={`flex flex-col items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${deliveryOption === 'Delivery' ? 'bg-brand-green/5 border-brand-green' : 'bg-white border-gray-100 hover:border-brand-green/30'}`}>
                      <input type="radio" name="delivery" value="Delivery" checked={deliveryOption === 'Delivery'} onChange={() => setDeliveryOption('Delivery')} className="sr-only" />
                      <Truck size={24} className={deliveryOption === 'Delivery' ? 'text-brand-green' : 'text-gray-300'} />
                      <span className={`mt-2 font-bold text-sm ${deliveryOption === 'Delivery' ? 'text-brand-green' : 'text-gray-500'}`}>Delivery</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">To Your Door</span>
                    </label>
                  </div>

                  {deliveryOption === 'Delivery' && (
                    <div className="space-y-4 p-5 bg-brand-green/5 rounded-2xl border border-brand-green/10 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-green uppercase tracking-widest ml-1">Street Address</label>
                        <input
                          type="text"
                          placeholder="123 Wellness Way"
                          value={addressStreet}
                          onChange={(e) => setAddressStreet(e.target.value)}
                          required
                          className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-bold text-brand-green uppercase tracking-widest ml-1">City</label>
                          <input
                            type="text"
                            placeholder="Riverside"
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                            required
                            className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-brand-green uppercase tracking-widest ml-1">State</label>
                          <input
                            type="text"
                            placeholder="CA"
                            value={addressState}
                            onChange={(e) => setAddressState(e.target.value)}
                            required
                            className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-brand-green uppercase tracking-widest ml-1">Zip Code</label>
                          <input
                            type="text"
                            placeholder="92501"
                            value={addressZip}
                            onChange={(e) => setAddressZip(e.target.value)}
                            required
                            className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-brand-brown/60 italic text-center leading-tight">Note: For deliveries outside the Riverside area, we ship frozen. Additional shipping fees will apply.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Checkout Details - Show if cart has items OR donation > 0 */}
        {(cart.length > 0 || donationAmount > 0) && (
          <>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="bg-brand-green/5 px-4 py-3 border-b border-brand-green/10 flex items-center gap-2">
                <PackageCheck size={18} className="text-brand-green" />
                <h3 className="font-bold text-brand-green uppercase text-xs tracking-widest">Checkout Details</h3>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Donation Summary if present */}
                {donationAmount > 0 && (
                  <div className="p-4 bg-brand-orange/5 border border-brand-orange/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Heart size={18} className="text-brand-orange" />
                      <div>
                        <p className="text-sm font-bold text-brand-brown">Direct Donation</p>
                        <p className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">Thank you for your support!</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-brand-orange text-lg">${donationAmount.toFixed(2)}</p>
                      <button 
                        type="button" 
                        onClick={() => setDonationAmount(0)} 
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Total Summary */}
                <div className="flex justify-between items-center p-4 bg-brand-green text-white rounded-xl shadow-lg">
                  <span className="text-lg font-bold uppercase tracking-wider">Total Amount</span>
                  <span className="text-3xl font-black">${displayTotal.toFixed(2)}</span>
                </div>

                {/* Order Number Info */}
                <div className="p-4 bg-brand-cream rounded-xl border border-brand-light-green/30 text-center">
                  <p className="text-xs text-brand-brown uppercase font-bold tracking-widest mb-1">Your Unique Order #</p>
                  <p className="text-2xl font-mono font-black text-brand-green tracking-tighter">{cartId || 'LW-TEMP'}</p>
                  <p className="text-[10px] text-brand-brown/60 mt-2 italic leading-tight">Please include this number in your Zelle payment memo/note.</p>
                </div>

                {/* Zelle Instructions */}
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    <p className="font-black text-blue-900 uppercase text-xs tracking-widest">Prepayment Required</p>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">Please send <strong>${displayTotal.toFixed(2)}</strong> via Zelle to:</p>
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-white border border-blue-200 rounded-xl flex justify-between items-center group hover:border-blue-400 transition-all cursor-pointer">
                      <span className="font-mono font-bold text-blue-900">(951) 707-7468</span>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Kolini P. (Treasurer)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-600/70 mt-3 italic text-center">Order processing begins after payment confirmation.</p>
                </div>

                {/* Zelle Confirmation */}
                <div className="space-y-4 border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                  <label className="flex items-start cursor-pointer group">
                    <div className="relative flex items-center mt-1">
                      <input
                        type="checkbox"
                        id="zelle"
                        checked={zelleChecked}
                        onChange={(e) => setZelleChecked(e.target.checked)}
                        className="h-6 w-6 rounded-lg border-gray-300 text-brand-orange focus:ring-brand-orange bg-white transition-all cursor-pointer"
                      />
                    </div>
                    <div className="ml-4">
                      <span className="block text-sm font-bold text-brand-brown group-hover:text-brand-orange transition-colors">I have sent the Zelle payment</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Required to place order</span>
                    </div>
                  </label>

                  {zelleChecked && (
                    <div className="pl-10 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label htmlFor="zelleConfirmation" className="text-[10px] font-black text-brand-brown uppercase tracking-widest block mb-2">
                        Zelle Confirmation # <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="zelleConfirmation"
                        placeholder="Enter confirmation code"
                        value={zelleConfirmation}
                        onChange={(e) => setZelleConfirmation(e.target.value)}
                        required
                        className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all font-mono text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-brand-green uppercase tracking-widest border-b border-brand-green/10 pb-2">Customer Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/30 focus:bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="(xxx) xxx-xxxx"
                        value={customerContact}
                        onChange={handlePhoneChange}
                        required
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/30 focus:bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/30 focus:bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex flex-col gap-4 pt-4">
              <button
                type="submit"
                className="w-full bg-brand-orange text-white font-black py-5 px-6 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-3 text-lg uppercase tracking-wider"
                disabled={!canPlaceOrder}
              >
                <Send size={24} />
                Place Order Now
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full flex items-center justify-center gap-2 text-gray-400 font-bold py-3 px-4 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all text-sm"
              >
                <Trash2 size={18} /> Clear Order & Start Over
              </button>
            </div>
          </>
        )}
      </div>
    </form>

  );
};

export default OrderForm;