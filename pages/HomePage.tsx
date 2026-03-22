import React from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import OrderForm from '../components/OrderForm';
import FundraisingTracker from '../components/FundraisingTracker';
import { ShoppingCart, HelpCircle, Smartphone, Send, PackageCheck, Heart, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { products } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      {/* Wellness Shots Heading Section */}
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-center">Our Wellness Shots</h1>
          <p className="text-center text-brand-brown mt-2 max-w-2xl mx-auto">
            Support our LST fundraiser by purchasing a delicious, cold-pressed wellness juice shot. Each one is made with love and fresh ingredients.
          </p>
        </div>

        {/* Subscription Goal CTA */}
        <div className="max-w-4xl mx-auto bg-brand-orange/5 border border-brand-orange/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-orange/20 rounded-full shrink-0">
              <Target className="text-brand-orange" size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-lg text-brand-brown">Support Our Subscription Goal</h4>
              <p className="text-sm text-brand-brown/70">Help us reach our monthly target and support our youth ministry.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/subscription-goal')}
            className="px-6 py-3 bg-brand-orange hover:bg-brand-orange/90 rounded-xl font-bold text-sm text-white transition-colors whitespace-nowrap shadow-lg flex items-center gap-2"
          >
            <Target size={16} />
            View Goal & Donate
          </button>
        </div>
      </div>

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