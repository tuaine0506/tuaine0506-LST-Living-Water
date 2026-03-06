import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Leaf, Check, X, AlertTriangle, RefreshCw, Plus, Trash2 } from 'lucide-react';

const IngredientsPage: React.FC = () => {
  const { ingredients, toggleIngredientAvailability, addIngredient, deleteIngredient, isAdmin } = useApp();
  const [confirmingIngredient, setConfirmingIngredient] = useState<string | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggleClick = (name: string) => {
    setConfirmingIngredient(name);
  };

  const handleConfirmToggle = async () => {
    if (!confirmingIngredient) return;
    
    const name = confirmingIngredient;
    setConfirmingIngredient(null);
    setIsUpdating(name);
    
    try {
      await toggleIngredientAvailability(name);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredientName.trim()) return;
    
    setIsAdding(true);
    try {
      await addIngredient({ name: newIngredientName.trim() });
      setNewIngredientName('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteClick = (name: string) => {
    setDeletingIngredient(name);
  };

  const handleConfirmDelete = async () => {
    if (!deletingIngredient) return;
    
    const name = deletingIngredient;
    setDeletingIngredient(null);
    setIsUpdating(name);
    
    try {
      await deleteIngredient(name);
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <AlertTriangle size={48} className="text-brand-orange mb-4" />
        <h2 className="text-2xl font-bold text-brand-green font-serif">Access Denied</h2>
        <p className="text-brand-brown mt-2">You must be an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif">Ingredient Inventory</h1>
        <p className="text-brand-brown mt-2">Manage the availability of raw materials for production.</p>
      </div>

      {/* Add Ingredient Form */}
      <div className="bg-white rounded-3xl shadow-lg border border-brand-light-green/20 p-6">
        <h3 className="text-lg font-bold text-brand-green font-serif mb-4 flex items-center gap-2">
          <Plus className="text-brand-orange" size={20} /> Add New Ingredient
        </h3>
        <form onSubmit={handleAddIngredient} className="flex gap-3">
          <input
            type="text"
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            placeholder="Ingredient name (e.g., Ginger Root)"
            className="flex-grow p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all"
            required
          />
          <button
            type="submit"
            disabled={isAdding || !newIngredientName.trim()}
            className="bg-brand-green text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-md disabled:bg-gray-300 flex items-center gap-2"
          >
            {isAdding ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-brand-light-green/20 overflow-hidden">
        <div className="p-6 bg-brand-green text-white flex items-center gap-3">
          <Leaf className="text-brand-orange" size={24} />
          <h2 className="text-xl font-bold font-serif">Current Stock Status</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {ingredients.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-4" />
              <p>Loading ingredients...</p>
            </div>
          ) : (
            ingredients.map((ingredient) => (
              <div key={ingredient.name} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ingredient.available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Leaf size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-brand-brown text-lg">{ingredient.name}</p>
                    <p className={`text-xs font-bold uppercase tracking-wider ${ingredient.available ? 'text-green-600' : 'text-red-500'}`}>
                      {ingredient.available ? 'In Stock' : 'Out of Stock'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleClick(ingredient.name)}
                    disabled={isUpdating === ingredient.name}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95 ${
                      ingredient.available 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    {isUpdating === ingredient.name ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : ingredient.available ? (
                      <X size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    {ingredient.available ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteClick(ingredient.name)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Ingredient"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-brand-cream/20 p-6 rounded-3xl border border-brand-cream/50 flex gap-4 items-start">
        <Info className="text-brand-green shrink-0 mt-1" size={20} />
        <div className="text-sm text-brand-brown leading-relaxed">
          <p className="font-bold mb-1">Impact of Disabling Ingredients:</p>
          <p>Disabling an ingredient will mark it as "Unavailable" in the recipes. This helps volunteer groups know what shots cannot be produced due to missing stock.</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmingIngredient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-light-green animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-brand-green font-serif mb-2">Confirm Status Change</h3>
              <p className="text-brand-brown">
                Are you sure you want to change the availability of <strong>{confirmingIngredient}</strong>?
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setConfirmingIngredient(null)}
                  className="py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmToggle}
                  className="py-3 px-4 bg-brand-green text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingIngredient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-red-200 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-red-800 font-serif mb-2">Delete Ingredient?</h3>
              <p className="text-gray-600">
                Are you sure you want to permanently delete <strong>{deletingIngredient}</strong>? This cannot be undone.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setDeletingIngredient(null)}
                  className="py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ className?: string, size?: number }> = ({ className, size = 20 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);

export default IngredientsPage;
