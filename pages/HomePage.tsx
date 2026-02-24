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
      <section id="how-to-order" className="bg-brand-green rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-light-green/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/10 rounded-xl">
              <HelpCircle className="text-brand-orange" size={24} />
            </div>
            <h2 className="text-2xl font-bold font-serif">How to Order & Donate</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-brand-orange rounded-full flex items-center justify-center font-bold text-lg shadow-lg">1</div>
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-brand-light-green" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Choose Shots</h3>
              </div>
              <p className="text-xs text-brand-cream/80 leading-relaxed">Select your favorite immunity shots or enter a donation amount below.</p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-brand-orange rounded-full flex items-center justify-center font-bold text-lg shadow-lg">2</div>
              <div className="flex items-center gap-2">
                <Send size={18} className="text-brand-light-green" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Zelle Payment</h3>
              </div>
              <p className="text-xs text-brand-cream/80 leading-relaxed">Prepay via Zelle using the order # in the memo. (Orders are verified after payment).</p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-brand-orange rounded-full flex items-center justify-center font-bold text-lg shadow-lg">3</div>
              <div className="flex items-center gap-2">
                <PackageCheck size={18} className="text-brand-light-green" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Pick Up</h3>
              </div>
              <p className="text-xs text-brand-cream/80 leading-relaxed">Collect your order this Sunday at the Fellowship or choose delivery.</p>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-center items-center text-center">
              <Heart className="text-brand-orange mb-2" size={32} />
              <p className="text-[10px] font-bold uppercase text-brand-light-green tracking-widest">Support the Mission</p>
              <p className="text-[11px] text-brand-cream/60 mt-1 italic">Every bottle supports our Fellowship outreach.</p>
            </div>
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
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
          <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="h-8 w-8 text-brand-orange"/>
              <h2 className="text-2xl font-bold text-brand-green font-serif">Place Your Order</h2>
          </div>
          <OrderForm />
      </div>
    </div>
  );
};

export default HomePage;