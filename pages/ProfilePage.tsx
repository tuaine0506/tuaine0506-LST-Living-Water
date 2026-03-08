import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, ShieldCheck, Search, History, Package, Calendar, CheckCircle, Clock, ArrowLeft, RefreshCw, Save, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

type VerificationStep = 'identify' | 'verify' | 'display';

const ProfilePage: React.FC = () => {
  const { orders } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('identify');
  const [enteredCode, setEnteredCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Profile editing state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Load saved profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  }, []);

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

      // If verified, try to pre-fill profile data from the latest order if not already set
      if (filteredOrders.length > 0 && !profileData.name) {
        const latestOrder = filteredOrders[0];
        const newProfile = {
          name: latestOrder.customerName,
          email: latestOrder.customerEmail || '',
          phone: latestOrder.customerContact,
          address: latestOrder.deliveryAddress || ''
        };
        setProfileData(newProfile);
        localStorage.setItem('user_profile', JSON.stringify(newProfile));
      }

      setVerificationStep('display');
      setIsVerifying(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call or just save to localStorage
    setTimeout(() => {
      localStorage.setItem('user_profile', JSON.stringify(profileData));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const reset = () => {
    setVerificationStep('identify');
    setEnteredCode('');
    setGeneratedCode('');
    setPreviewUrl('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-brand-green font-serif">My Profile</h1>
        <p className="text-brand-brown">Manage your information and view your order history.</p>
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
                <h2 className="text-xl font-bold text-brand-green">Access Your Profile</h2>
                <p className="text-brand-brown/70 text-sm">Enter your email or phone number to securely access your profile and order history.</p>
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
                <User size={20} />
                Verify Identity
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
                  {isVerifying ? 'Verifying...' : 'Access Profile'}
                </button>
                
                <button
                  type="button"
                  onClick={reset}
                  className="text-brand-brown/60 text-xs font-medium hover:text-brand-green transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={12} />
                  Change Details
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {verificationStep === 'display' && (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Profile Information Section */}
            <div className="bg-white rounded-2xl shadow-md border border-brand-light-green/30 overflow-hidden">
              <div className="bg-brand-green p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-serif">Contact Information</h2>
                    <p className="text-brand-light-green text-xs">Used to pre-fill your future orders</p>
                  </div>
                </div>
                <button 
                  onClick={reset}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors font-bold"
                >
                  Sign Out
                </button>
              </div>
              
              <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-brown uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/40" size={18} />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-light-green/50 focus:ring-2 focus:ring-brand-green outline-none"
                        placeholder="Your Name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-brown uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/40" size={18} />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-light-green/50 focus:ring-2 focus:ring-brand-green outline-none"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-brown uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/40" size={18} />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-light-green/50 focus:ring-2 focus:ring-brand-green outline-none"
                        placeholder="555-0123"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-brand-brown uppercase tracking-wider">Default Delivery Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/40" size={18} />
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-light-green/50 focus:ring-2 focus:ring-brand-green outline-none"
                        placeholder="123 Wellness Way"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-brand-light-green/10">
                  {saveSuccess && (
                    <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                      <CheckCircle size={16} /> Profile saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-brand-orange text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-orange/90 transition-all flex items-center gap-2 shadow-lg shadow-brand-orange/20 disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Order History Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <History className="text-brand-green" size={24} />
                <h2 className="text-2xl font-bold text-brand-green font-serif">Order History</h2>
              </div>
              
              <div className="grid gap-6">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-dashed border-brand-light-green/40 text-center space-y-4">
                    <Package className="mx-auto text-brand-brown/20" size={48} />
                    <p className="text-brand-brown/60 font-medium">No orders found for this account.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
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
                              <div className="flex justify-between pt-2 border-t border-brand-light-green/20">
                                <span className="text-lg font-bold text-brand-green">Total Paid:</span>
                                <span className="text-lg font-mono font-bold text-brand-green">${order.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
