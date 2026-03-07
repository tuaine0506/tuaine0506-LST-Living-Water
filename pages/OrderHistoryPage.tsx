import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, History, Package, Calendar, CheckCircle, Clock, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

type VerificationStep = 'identify' | 'verify' | 'display';

const OrderHistoryPage: React.FC = () => {
  const { orders } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('identify');
  const [enteredCode, setEnteredCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const filteredOrders = orders.filter(order => 
    order.customerEmail?.toLowerCase() === identifier.toLowerCase() ||
    order.customerContact.includes(identifier)
  ).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  const [previewUrl, setPreviewUrl] = useState('');

  const handleIdentify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setGeneratedCode('');
    setPreviewUrl('');
    
    try {
      const res = await fetch('/api/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }
      
      if (data.code) {
        setGeneratedCode(data.code);
      }
      
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }

      setVerificationStep('verify');
      setResendCountdown(30);
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code: enteredCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid verification code. Please try again.');
        setIsVerifying(false);
        return;
      }

      setVerificationStep('display');
      setIsVerifying(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsVerifying(false);
    }
  };

  const reset = () => {
    setVerificationStep('identify');
    setEnteredCode('');
    setGeneratedCode('');
    setPreviewUrl('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-brand-green font-serif">Order History</h1>
        <p className="text-brand-brown">Securely view your past wellness shot purchases.</p>
      </div>

      <AnimatePresence mode="wait">
        {verificationStep === 'identify' && (
          <motion.div
            key="identify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-2xl shadow-md border border-brand-light-green/30 space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-brand-green/10 rounded-full">
                <ShieldCheck className="text-brand-green" size={32} />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-brand-green">Verify Your Identity</h2>
                <p className="text-brand-brown/70 text-sm">Enter the email or phone number used for your orders. We'll send you a verification code.</p>
              </div>
            </div>

            <form onSubmit={handleIdentify} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/50" size={20} />
                <input
                  type="text"
                  placeholder="Email or Phone Number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-light-green focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
              <button
                type="submit"
                className="w-full bg-brand-green text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-green/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
              >
                <History size={20} />
                Send Verification Code
              </button>
            </form>
          </motion.div>
        )}

        {verificationStep === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-2xl shadow-md border border-brand-light-green/30 space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-brand-orange/10 rounded-full">
                <ShieldCheck className="text-brand-orange" size={32} />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-brand-green">Enter Verification Code</h2>
                <p className="text-brand-brown/70 text-sm">
                  We've sent a 6-digit code to <span className="font-bold text-brand-brown">{identifier}</span>.
                  <br />
                  {previewUrl ? (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] italic text-brand-green underline">
                      (Demo: View Email)
                    </a>
                  ) : generatedCode ? (
                    <span className="text-[10px] italic text-brand-brown/40">(Demo: Check console or use {generatedCode})</span>
                  ) : null}
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 rounded-xl border border-brand-light-green focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                required
              />
              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
              
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isVerifying || enteredCode.length !== 6}
                  className="w-full bg-brand-green text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
                >
                  {isVerifying ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  {isVerifying ? 'Verifying...' : 'Verify & View History'}
                </button>
                
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={reset}
                    className="text-brand-brown/60 text-xs font-medium hover:text-brand-green transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft size={12} />
                    Change Details
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleIdentify()}
                    disabled={resendCountdown > 0}
                    className="text-brand-green text-xs font-bold hover:underline disabled:text-brand-brown/40 disabled:no-underline transition-all"
                  >
                    {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {verificationStep === 'display' && (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-brand-cream/20 p-4 rounded-xl border border-brand-light-green/20">
              <div className="flex items-center gap-2 text-brand-brown">
                <ShieldCheck className="text-brand-green" size={18} />
                <span className="text-sm font-medium italic">Verified for {identifier}</span>
              </div>
              <button 
                onClick={reset}
                className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Change
              </button>
            </div>

            <div className="grid gap-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-brand-light-green/20 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-brand-cream/30 p-4 border-b border-brand-light-green/10 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-green/10 rounded-lg">
                        <Package className="text-brand-green" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-brown/60 uppercase tracking-wider">Order Number</p>
                        <p className="font-mono font-bold text-brand-green">{order.orderNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-orange/10 rounded-lg">
                        <Calendar className="text-brand-orange" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-brown/60 uppercase tracking-wider">Order Date</p>
                        <p className="font-bold text-brand-brown">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                      order.isFulfilled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.isFulfilled ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {order.isFulfilled ? 'Fulfilled' : 'Pending'}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="font-bold text-brand-green border-b border-brand-light-green/20 pb-1">Items</h3>
                        <ul className="space-y-2">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span className="text-brand-brown">
                                <span className="font-bold">{item.quantity}x</span> {item.productName}
                                {item.selectedOptionalIngredients && item.selectedOptionalIngredients.length > 0 && (
                                  <span className="block text-[10px] text-brand-brown/60 italic">
                                    + {item.selectedOptionalIngredients.join(', ')}
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-brand-green font-bold">${(item.quantity * 35).toFixed(2)}</span>
                            </li>
                          ))}
                          {order.donationAmount > 0 && (
                            <li className="flex justify-between text-sm pt-2 border-t border-dashed border-brand-light-green/30">
                              <span className="text-brand-brown italic">Additional Donation</span>
                              <span className="font-mono text-brand-green font-bold">${order.donationAmount.toFixed(2)}</span>
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bold text-brand-green border-b border-brand-light-green/20 pb-1">Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-brand-brown/60">Delivery Option:</span>
                            <span className="font-bold text-brand-brown">{order.deliveryOption}</span>
                          </div>
                          {order.deliveryAddress && (
                            <div className="flex justify-between">
                              <span className="text-brand-brown/60">Address:</span>
                              <span className="font-bold text-brand-brown text-right max-w-[200px]">{order.deliveryAddress}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-brand-brown/60">Zelle Confirmation:</span>
                            <span className="font-mono font-bold text-brand-orange">{order.zelleConfirmationNumber}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-brand-light-green/20">
                            <span className="text-lg font-bold text-brand-green">Total Paid:</span>
                            <span className="text-lg font-mono font-bold text-brand-green">${order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderHistoryPage;
