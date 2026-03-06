import React, { useState } from 'react';
import { Product, OrderSize } from '../types';
import { useApp } from '../context/AppContext';
import { PlusCircle, CheckCircle, CheckSquare, Square, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [size, setSize] = useState<OrderSize>(OrderSize.SevenShots);
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const { addToCart, ingredients: allIngredients, isAdmin, updateProduct } = useApp();

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

  const handleDeleteIngredient = (ingredientToDelete: string) => {
    if (!isAdmin) return;
    const updatedIngredients = product.ingredients.filter(ing => ing !== ingredientToDelete);
    updateProduct(product.id, { ingredients: updatedIngredients });
  };

  const getPlaceholderImage = (color: string, name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://placehold.co/600x400/${color.substring(1)}/FFFFFF/png?text=${initials}&font=montserrat`;
  };

  const isIngredientAvailable = (name: string) => {
    const cleanName = name.replace(/\s*\(optional\)\s*/i, '').trim();
    const ingredient = allIngredients.find(i => i.name === cleanName || i.name === name);
    return ingredient ? ingredient.available : true;
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
        
        <div 
          className="space-y-2 relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center gap-1.5 cursor-help">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ingredients</p>
            <Info size={10} className="text-gray-400" />
          </div>
          
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 w-64 z-20 bg-brand-green text-white text-[10px] p-3 rounded-xl shadow-2xl border border-white/20 pointer-events-none"
              >
                <p className="font-bold mb-1 border-b border-white/10 pb-1 flex items-center gap-1">
                   Full Ingredient List
                </p>
                <p className="leading-relaxed opacity-90">
                  {product.ingredients.map(ing => ing.replace(/\s*\(optional\)\s*/i, '').trim()).join(', ')}
                </p>
                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-brand-green rotate-45 border-r border-b border-white/20"></div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-1.5">
            {product.ingredients.map((ingredient, idx) => {
              const isOptional = ingredient.toLowerCase().includes('(optional)');
              const cleanName = ingredient.replace(/\s*\(optional\)\s*/i, '').trim();
              const available = isIngredientAvailable(ingredient);
              
              if (isOptional) {
                const isSelected = selectedOptionals.includes(ingredient);
                return (
                  <div key={idx} className="relative group/ing">
                    <button
                      onClick={() => toggleOptional(ingredient)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        isSelected 
                          ? 'bg-brand-orange border-brand-orange text-white shadow-sm' 
                          : 'bg-white border-brand-orange/30 text-brand-orange hover:bg-brand-orange/5'
                      } ${!available ? 'opacity-50 grayscale' : ''}`}
                    >
                      {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                      {cleanName} <span className="opacity-70 font-medium">(opt)</span>
                      {!available && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded ml-1">Out</span>}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteIngredient(ingredient);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover/ing:opacity-100 transition-opacity"
                      >
                        <X size={8} />
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <div key={idx} className="relative group/ing">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full border flex items-center gap-1 ${
                    available 
                      ? 'bg-brand-cream/30 text-brand-brown border-brand-cream/50' 
                      : 'bg-red-50 text-red-500 border-red-100'
                  }`}>
                    {ingredient}
                    {!available && <span className="text-[8px] font-bold uppercase tracking-tighter bg-red-100 px-1 rounded">Out</span>}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIngredient(ingredient);
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover/ing:opacity-100 transition-opacity"
                    >
                      <X size={8} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-brand-light-green/30">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-sm font-medium text-brand-brown block mb-1">Size</label>
            <div className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-brand-brown font-medium">
              7-Pack (2oz)
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-brand-brown block mb-1">Qty</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-brand-orange focus:border-brand-orange text-sm"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
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