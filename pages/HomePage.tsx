import React from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import OrderForm from '../components/OrderForm';
import { ShoppingCart, HelpCircle, Smartphone, Send, PackageCheck, Heart } from 'lucide-react';

const HomePage: React.FC = () => {
  const { products } = useApp();

  return (
    <div className="space-y-12">
      {/* Wellness Shots Heading Section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-center">Our Wellness Shots</h1>
        <p className="text-center text-brand-brown mt-2 max-w-2xl mx-auto">
          Support our LST fundraiser by purchasing a delicious, cold-pressed wellness juice shot. Each one is made with love and fresh ingredients.
        </p>
      </div>

      {/* Tutorial Banner */}
      <section id="how-to-order" className="bg-brand-green rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-light-green/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
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
                Choose your favorite immunity shots from the menu below. You can also add a direct donation to your order.
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

          {/* Donation Highlight */}
          <div className="mt-12 bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-orange/20 rounded-full shrink-0">
                <Heart className="text-brand-orange" size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-lg">Just want to donate?</h4>
                <p className="text-sm text-brand-cream/70">You can skip the shots and enter a donation amount directly in the order form.</p>
              </div>
            </div>
            <button 
              onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 bg-brand-orange hover:bg-brand-orange/90 rounded-xl font-bold text-sm transition-colors whitespace-nowrap shadow-lg flex items-center gap-2"
            >
              <Heart size={16} />
              Go to Donation Form
            </button>
          </div>
        </div>
      </section>

      {/* The Shots Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.filter(p => p.available).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {/* Order Form Section */}
      <div id="order-form" className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
          <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="h-8 w-8 text-brand-orange"/>
              <h2 className="text-2xl font-bold text-brand-green font-serif">Place Your Order</h2>
          </div>
          <OrderForm />
      </div>

      {/* Footer */}
      <footer className="text-center text-brand-brown/60 text-sm py-8 space-y-2">
        <p>© {new Date().getFullYear()} Living Water Wellness. All rights reserved.</p>
        <p>
          Questions? Contact us at <a href="mailto:teisi.uaine@gmail.com" className="text-brand-green font-bold hover:underline">teisi.uaine@gmail.com</a>
        </p>
        <p className="text-xs max-w-md mx-auto pt-4 border-t border-brand-brown/10 mt-4">
          Proceeds support the La Sierra Tongan SDA Fellowship youth ministry. Thank you for your support!
        </p>
      </footer>
    </div>
  );
};

export default HomePage;