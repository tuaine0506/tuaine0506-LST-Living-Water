import React, { useState } from 'react';
import { Product, OrderSize } from '../types';
import { useApp } from '../context/AppContext';
import { PlusCircle, CheckCircle, CheckSquare, Square } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [size, setSize] = useState<OrderSize>(OrderSize.SevenShots);
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>([]);
  const { addToCart } = useApp();

  const handleAddToCart = () => {
    addToCart(product.id, size, quantity, selectedOptionals);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  
  const toggleOptional = (ingredient: string) => {
    setSelectedOptionals(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient) 
        : [...prev, ingredient]
    );
  };

  const getPlaceholderImage = (color: string, name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://placehold.co/600x400/${color.substring(1)}/FFFFFF/png?text=${initials}&font=montserrat`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-brand-light-green/30 flex flex-col justify-between transition-transform duration-300 hover:scale-105">
      <img 
        src={getPlaceholderImage(product.imageColor, product.name)} 
        alt={product.name} 
        className="w-full h-48 object-cover" 
      />
      <div className="p-4 flex-grow space-y-3">
        <div>
          <h3 className="text-xl font-bold text-brand-green font-serif">{product.name}</h3>
          <p className="text-sm text-brand-brown mt-1">{product.description}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ingredients</p>
          <div className="flex flex-wrap gap-1.5">
            {product.ingredients.map((ingredient, idx) => {
              const isOptional = ingredient.toLowerCase().includes('(optional)');
              const cleanName = ingredient.replace(/\s*\(optional\)\s*/i, '').trim();
              
              if (isOptional) {
                const isSelected = selectedOptionals.includes(ingredient);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleOptional(ingredient)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      isSelected 
                        ? 'bg-brand-orange border-brand-orange text-white shadow-sm' 
                        : 'bg-white border-brand-orange/30 text-brand-orange hover:bg-brand-orange/5'
                    }`}
                  >
                    {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                    {cleanName} <span className="opacity-70 font-medium">(opt)</span>
                  </button>
                );
              }
              return (
                <span key={idx} className="bg-brand-cream/30 text-brand-brown text-[10px] font-medium px-2 py-1 rounded-full border border-brand-cream/50">
                  {ingredient}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-brand-light-green/30">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-sm font-medium text-brand-brown block mb-1">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as OrderSize)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
            >
              <option value={OrderSize.SevenShots}>7-Pack (2oz)</option>
              <option value={OrderSize.TwelveOunce}>12oz Bottle</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-brand-brown block mb-1">Qty</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange"
            />
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          className={`w-full text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-300 ${
            added ? 'bg-green-500' : 'bg-brand-orange hover:bg-opacity-90'
          }`}
        >
          {added ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" /> Added to Cart!
            </>
          ) : (
            <>
              <PlusCircle className="h-5 w-5 mr-2" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;