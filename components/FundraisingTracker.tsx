import React from 'react';
import { useApp } from '../context/AppContext';
import { FUNDRAISING_GOAL } from '../constants';
import { motion } from 'motion/react';
import { Target, TrendingUp, Users, Heart, DollarSign } from 'lucide-react';

const FundraisingTracker: React.FC = () => {
  const { orders } = useApp();

  // Calculate current recurring subscriptions
  const currentSubscriptions = orders.filter(order => order.isRecurring).length;
  const percentage = Math.min(Math.round((currentSubscriptions / FUNDRAISING_GOAL) * 100), 100);
  
  // Calculate total funds raised (totalPrice + donationAmount)
  const totalRaised = orders.reduce((acc, order) => acc + (order.totalPrice || 0) + (order.donationAmount || 0), 0);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-brand-light-green/20 relative overflow-hidden group">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-brand-orange/10"></div>
      
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Left Side: Stats */}
          <div className="flex-shrink-0 text-center md:text-left space-y-2 min-w-[200px]">
            <div className="inline-flex items-center gap-2 bg-brand-orange/10 px-3 py-1 rounded-full text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
              <Target size={14} />
              <span>Subscription Goal</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-brand-green">
              {currentSubscriptions} <span className="text-xl md:text-2xl text-brand-brown/60 font-sans">/ {FUNDRAISING_GOAL}</span>
            </h2>
            <p className="text-brand-brown font-medium">Recurring Subscriptions</p>
          </div>

          {/* Right Side: Progress Bar */}
          <div className="flex-grow w-full space-y-4">
            <div className="flex justify-between items-end mb-1">
              <div className="flex items-center gap-2 text-brand-green font-bold">
                <TrendingUp size={18} className="text-brand-orange" />
                <span>Campaign Progress</span>
              </div>
              <span className="text-2xl font-bold text-brand-orange font-serif">{percentage}%</span>
            </div>

            {/* Progress Bar Container */}
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200 p-1 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-brand-orange to-brand-orange/80 rounded-full shadow-lg relative"
              >
                {/* Animated Shine Effect */}
                <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </motion.div>
            </div>

            <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-brown/50">
              <span>Started</span>
              <div className="flex items-center gap-1 text-brand-green">
                <Users size={12} />
                <span>{Math.max(0, FUNDRAISING_GOAL - currentSubscriptions)} more to go!</span>
              </div>
              <span>Goal: {FUNDRAISING_GOAL}</span>
            </div>
          </div>
        </div>

        {/* Secondary Stats: Total Raised */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
          <div className="bg-brand-green/5 rounded-2xl p-4 flex items-center gap-4 border border-brand-green/10">
            <div className="p-3 bg-brand-green/10 rounded-xl text-brand-green">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Total Funds Raised</p>
              <p className="text-2xl font-black text-brand-brown">${totalRaised.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-brand-orange/5 rounded-2xl p-4 flex items-center gap-4 border border-brand-orange/10">
            <div className="p-3 bg-brand-orange/10 rounded-xl text-brand-orange">
              <Heart size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">Total Supporters</p>
              <p className="text-2xl font-black text-brand-brown">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Mini Call to Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-brand-brown/70 italic text-center sm:text-left">
            "Every subscription helps us reach more youth in our community."
          </p>
          <button 
            onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-bold text-brand-orange hover:text-brand-green transition-colors flex items-center gap-1 uppercase tracking-widest"
          >
            Subscribe Now & Help Us Reach the Goal
            <TrendingUp size={14} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
};

export default FundraisingTracker;
