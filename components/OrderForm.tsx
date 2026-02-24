import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductPrices, DeliveryOption } from '../types';
import { X, Trash2, Heart } from 'lucide-react';

const OrderForm: React.FC = () => {
  const { cart, cartId, donationAmount, setDonationAmount, removeFromCart, updateCartQuantity, placeOrder, clearCart } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('Pickup');
  
  // Split address state
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');

  const [zelleChecked, setZelleChecked] = useState(false);
  const [zelleConfirmation, setZelleConfirmation] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{ deliveryOption: DeliveryOption } | null>(null);

  const cartTotal = cart.reduce((acc, item) => {
    return acc + ProductPrices[item.size] * item.quantity;
  }, 0);
  
  const productPrice = isRecurring ? cartTotal * 4 : cartTotal;
  const displayTotal = productPrice + donationAmount;

  // Phone number formatter: (xxx) xxx-xxxx
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
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
                        (deliveryOption === 'Pickup' || (deliveryOption === 'Delivery' && addressStreet && addressCity && addressState && addressZip));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlaceOrder) {
      alert('Please fill out all required fields correctly.');
      return;
    }

    const fullAddress = deliveryOption === 'Delivery' 
      ? `${addressStreet}, ${addressCity}, ${addressState} ${addressZip}`
      : undefined;

    setLastOrderDetails({ deliveryOption });
    placeOrder(customerName, customerContact, customerEmail, deliveryOption, fullAddress, zelleConfirmation, isRecurring);
    
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {cart.length === 0 && donationAmount === 0 ? (
        <p className="text-center text-gray-500 py-4">Your order is empty. Add some wellness shots or a donation to support our fellowship!</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {cart.map(item => (
            <div key={`${item.productId}-${item.size}`} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div>
                <p className="font-semibold text-brand-brown">{item.productName}</p>
                <p className="text-sm text-gray-500">{item.size}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateCartQuantity(item.productId, item.size, parseInt(e.target.value))}
                  className="w-16 p-1 border border-gray-300 rounded-md text-center bg-white"
                />
                <p className="w-16 text-right font-medium text-brand-green">${(ProductPrices[item.size] * item.quantity).toFixed(2)}</p>
                <button type="button" onClick={() => removeFromCart(item.productId, item.size)} className="text-red-500 hover:text-red-700">
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
          {donationAmount > 0 && (
            <div className="flex items-center justify-between p-3 bg-brand-orange/5 border border-brand-orange/20 rounded-lg">
                <div className="flex items-center gap-2">
                    <Heart size={18} className="text-brand-orange" />
                    <p className="font-semibold text-brand-brown">Direct Donation</p>
                </div>
                <div className="flex items-center gap-3">
                    <p className="font-bold text-brand-orange">${donationAmount.toFixed(2)}</p>
                    <button type="button" onClick={() => setDonationAmount(0)} className="text-red-500 hover:text-red-700">
                      <X size={20} />
                    </button>
                </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-brand-light-green/30 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
            <Heart size={20} className="text-brand-orange" />
            <h4 className="font-bold text-brand-green font-serif">Support with a Donation</h4>
        </div>
        <p className="text-xs text-brand-brown mb-3">Want to support the Fellowship without or in addition to shots? Enter a donation amount below.</p>
        <div className="flex gap-2">
            <div className="relative flex-grow">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="Enter amount"
                    value={donationAmount || ''}
                    onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
                />
            </div>
            {donationAmount === 0 && (
                <div className="flex gap-1">
                    {[10, 20, 50].map(amt => (
                        <button
                            key={amt}
                            type="button"
                            onClick={() => setDonationAmount(amt)}
                            className="bg-brand-cream text-brand-brown text-sm font-bold px-3 py-1 rounded-md hover:bg-brand-light-green transition-colors"
                        >
                            +${amt}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
      
      {(cart.length > 0 || donationAmount > 0) && (
          <>
             {cart.length > 0 && (
                <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange bg-white"
                        />
                        <span className="ml-3 text-sm font-medium text-brand-brown">Make shot order recurring (4 weeks prepaid)</span>
                    </label>
                </div>
             )}

            <div className="flex justify-between items-center text-xl font-bold pt-4 border-t">
              <span className="text-brand-green">Total:</span>
              <span className="text-brand-orange">${displayTotal.toFixed(2)}</span>
            </div>

            <div className="text-center p-3 bg-white border border-brand-light-green text-brand-brown rounded-lg">
                <p className="font-semibold">Your Unique Order #: <span className="font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">{cartId || 'LW-TEMP'}</span></p>
                <p className="text-sm mt-1">Please include this number in your Zelle payment memo/note.</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md" role="alert">
              <p className="font-bold">Prepayment Required via Zelle</p>
              <p className="text-sm mt-1">Please send the total amount of <strong>${displayTotal.toFixed(2)}</strong> to one of the following:</p>
              <div className="text-sm font-mono bg-white border border-blue-200 px-2 py-2 rounded mt-1 space-y-1">
                <p>(951) 707-7468 Kolini P.</p>
                <p>(775) 376-0289 Teisi U.</p>
              </div>
              <p className="text-xs mt-2">Your order will only be processed after payment is confirmed.</p>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="zelle"
                checked={zelleChecked}
                onChange={(e) => setZelleChecked(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange mt-1 bg-white"
              />
              <label htmlFor="zelle" className="ml-3 text-sm text-brand-brown cursor-pointer">
                I have sent the Zelle payment for the total amount.
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
              />
              <input
                type="tel"
                placeholder="Phone (xxx) xxx-xxxx"
                value={customerContact}
                onChange={handlePhoneChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
              />
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Email Address (Optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
              />
              <p className="text-[10px] text-gray-500 mt-1 pl-1 italic">Provide an email if you prefer notifications via email.</p>
            </div>

            <div>
              <label htmlFor="zelleConfirmation" className="text-sm font-medium text-brand-brown block mb-2">Zelle Confirmation #</label>
              <input
                type="text"
                id="zelleConfirmation"
                placeholder="Enter Zelle confirmation code"
                value={zelleConfirmation}
                onChange={(e) => setZelleConfirmation(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
              />
            </div>

            {cart.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-brand-brown block mb-2">Delivery Option</label>
                  <div className="flex gap-4">
                    <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:bg-brand-light-green/20 has-[:checked]:border-brand-green w-full cursor-pointer transition-colors shadow-sm">
                      <input type="radio" name="delivery" value="Pickup" checked={deliveryOption === 'Pickup'} onChange={() => setDeliveryOption('Pickup')} className="h-4 w-4 text-brand-orange focus:ring-brand-orange bg-white" />
                      <span className="ml-2 font-medium text-brand-brown">Pickup</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg bg-white has-[:checked]:bg-brand-light-green/20 has-[:checked]:border-brand-green w-full cursor-pointer transition-colors shadow-sm">
                      <input type="radio" name="delivery" value="Delivery" checked={deliveryOption === 'Delivery'} onChange={() => setDeliveryOption('Delivery')} className="h-4 w-4 text-brand-orange focus:ring-brand-orange bg-white" />
                      <span className="ml-2 font-medium text-brand-brown">Delivery</span>
                    </label>
                  </div>
                </div>
            )}

            {deliveryOption === 'Delivery' && cart.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-brand-brown block -mb-1">Delivery Address</label>
                <input
                  type="text"
                  placeholder="Street Address"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   <input
                    type="text"
                    placeholder="City"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    required
                    className="md:col-span-2 w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
                  />
                  <input
                    type="text"
                    placeholder="Zip"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Note: For deliveries outside the Riverside area, we ship frozen. Additional shipping fees will apply.</p>
              </div>
            )}

             <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  className="w-full bg-brand-green text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400"
                  disabled={!canPlaceOrder}
                >
                  Place Order
                </button>
                <button
                    type="button"
                    onClick={clearCart}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    <Trash2 size={18}/> Clear
                </button>
             </div>
          </>
      )}

    </form>
  );
};

export default OrderForm;