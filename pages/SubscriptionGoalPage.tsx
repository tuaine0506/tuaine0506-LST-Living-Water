import React from 'react';
import { useApp } from '../context/AppContext';
import FundraisingTracker from '../components/FundraisingTracker';
import { Heart, Gift, PackageCheck, X, Send, Trash2, HelpCircle, Smartphone } from 'lucide-react';
import { DONATION_TIERS } from '../constants';
import { useNavigate } from 'react-router-dom';

const SubscriptionGoalPage: React.FC = () => {
  const { donationAmount, setDonationAmount, cart, clearCart } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-12 pb-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif">Subscription Goal</h1>
        <p className="text-brand-brown max-w-2xl mx-auto">
          Help us reach our monthly subscription goal to support our Youth & Young Adults ministry. 
          Every donation and subscription directly impacts our community.
        </p>
      </div>

      {/* Progress Tracker */}
      <div className="max-w-5xl mx-auto">
        <FundraisingTracker />
      </div>

      {/* Tutorial Section */}
      <section id="how-to-order" className="bg-brand-green rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden max-w-6xl mx-auto">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-light-green/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4 backdrop-blur-sm border border-white/10">
              <HelpCircle className="text-brand-orange" size={20} />
              <span className="text-sm font-bold tracking-wide uppercase">Simple 3-Step Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">How to Order & Donate</h2>
            <p className="text-brand-cream/80 max-w-2xl mx-auto">
              Support our youth ministry by ordering delicious wellness shots or making a direct donation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-brand-light-green/30 to-transparent z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-black/20 rounded-2xl border border-brand-light-green/20 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300 relative backdrop-blur-sm">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-brand-green">1</div>
                <Smartphone size={40} className="text-brand-light-green" />
              </div>
              <h3 className="text-xl font-bold mb-3">Select & Customize</h3>
              <p className="text-sm text-brand-cream/70 leading-relaxed px-4">
                Choose your favorite immunity shots from the menu. You can also add a direct donation to your order.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-black/20 rounded-2xl border border-brand-light-green/20 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300 relative backdrop-blur-sm">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-brand-green">2</div>
                <Send size={40} className="text-brand-light-green" />
              </div>
              <h3 className="text-xl font-bold mb-3">Zelle Payment</h3>
              <p className="text-sm text-brand-cream/70 leading-relaxed px-4">
                Complete your payment via Zelle. Include your unique <span className="text-brand-orange font-bold">Order #</span> in the memo for quick verification.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-black/20 rounded-2xl border border-brand-light-green/20 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300 relative backdrop-blur-sm">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-brand-green">3</div>
                <PackageCheck size={40} className="text-brand-light-green" />
              </div>
              <h3 className="text-xl font-bold mb-3">Pickup or Delivery</h3>
              <p className="text-sm text-brand-cream/70 leading-relaxed px-4">
                Collect your shots this Sunday at <span className="font-bold text-white">LSU Church</span>, or get home delivery with a recurring subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support with Donation Section */}
      <div className="bg-white rounded-3xl overflow-hidden border border-brand-light-green/50 shadow-xl max-w-4xl mx-auto">
        <div className="bg-brand-orange/5 px-6 py-4 border-b border-brand-orange/10 flex items-center gap-3">
          <Heart size={24} className="text-brand-orange" />
          <h2 className="text-xl font-bold text-brand-orange uppercase tracking-widest font-serif">Support with a Donation</h2>
        </div>
        
        <div className="p-8">
          <p className="text-sm text-brand-brown/70 mb-8 leading-relaxed">
            Your generosity fuels our mission. Choose a donation tier below or enter a custom amount. 
            All proceeds go directly to supporting our youth programs and community outreach.
          </p>
          
          {/* Donation Tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {DONATION_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setDonationAmount(tier.amount)}
                className={`flex flex-col p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
                  donationAmount === tier.amount
                    ? 'bg-brand-orange/10 border-brand-orange shadow-md scale-[1.02]'
                    : 'bg-white border-gray-100 hover:border-brand-orange/30'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${donationAmount === tier.amount ? 'text-brand-orange' : 'text-gray-400'}`}>
                    {tier.name}
                  </span>
                  <Gift size={18} className={donationAmount === tier.amount ? 'text-brand-orange' : 'text-gray-200'} />
                </div>
                <p className="text-3xl font-black text-brand-brown mb-2">${tier.amount}</p>
                <p className="text-xs text-brand-brown/60 leading-tight italic">
                  Reward: {tier.reward}
                </p>
                {donationAmount === tier.amount && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-brand-orange text-white flex items-center justify-center rounded-bl-xl">
                    <PackageCheck size={16} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="Enter custom amount"
                value={donationAmount === 0 ? '' : donationAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDonationAmount(isNaN(val) ? 0 : val);
                }}
                className="w-full pl-10 p-5 border border-gray-200 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all font-bold text-brand-brown text-lg"
              />
            </div>
            <div className="flex gap-2">
              {[10, 20, 50].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDonationAmount(amt)}
                  className={`flex-1 sm:flex-none px-6 py-5 rounded-2xl font-bold text-lg transition-all border ${donationAmount === amt ? 'bg-brand-orange border-brand-orange text-white shadow-lg' : 'bg-white border-gray-200 text-brand-brown hover:border-brand-orange hover:text-brand-orange'}`}
                >
                  +${amt}
                </button>
              ))}
            </div>
          </div>
          
          {/* Active Donation Summary */}
          {donationAmount > 0 && (
            <div className="mt-8 p-6 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-orange/10 rounded-xl">
                  <Heart size={24} className="text-brand-orange" />
                </div>
                <div>
                  <p className="font-bold text-brand-brown text-lg">Your Donation: ${donationAmount.toFixed(2)}</p>
                  <p className="text-xs text-brand-orange font-bold uppercase tracking-widest">Thank you for your incredible support!</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setDonationAmount(0)} 
                  className="flex-1 sm:flex-none px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
                <button 
                  onClick={() => navigate('/')}
                  className="flex-1 sm:flex-none px-8 py-3 bg-brand-orange text-white rounded-xl font-bold text-sm shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Complete at Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why Support Us Section */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-brand-green/5 p-8 rounded-3xl border border-brand-green/10">
          <h3 className="text-xl font-bold text-brand-green mb-4 font-serif">Where your money goes</h3>
          <ul className="space-y-3 text-sm text-brand-brown/80">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 shrink-0" />
              <span>Youth camp scholarships for those in financial need</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 shrink-0" />
              <span>Community outreach programs and local service projects</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 shrink-0" />
              <span>Leadership training and spiritual development workshops</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 shrink-0" />
              <span>Equipment and resources for our youth ministry space</span>
            </li>
          </ul>
        </div>
        <div className="bg-brand-orange/5 p-8 rounded-3xl border border-brand-orange/10">
          <h3 className="text-xl font-bold text-brand-orange mb-4 font-serif">The LST Mission</h3>
          <p className="text-sm text-brand-brown/80 leading-relaxed">
            The La Sierra Tongan SDA Fellowship is dedicated to empowering the next generation of leaders. 
            Through our wellness shot fundraiser, we not only promote healthy living but also create 
            opportunities for our youth to grow, serve, and lead with purpose.
          </p>
          <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-dashed border-brand-orange/20">
            <p className="text-xs italic text-brand-brown/60 text-center">
              "Truly I tell you, whatever you did for one of the least of these brothers and sisters of mine, you did for me."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGoalPage;
