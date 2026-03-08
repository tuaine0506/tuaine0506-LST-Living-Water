import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Utensils, BookOpen, Droplets, Info, ExternalLink, Scissors, Play, Eye, EyeOff, AlertTriangle, RefreshCw, Plus, Trash2, X as CloseIcon, Edit2, CheckCircle } from 'lucide-react';
import LazyVideoPlayer from '../components/LazyVideoPlayer';

const RecipesPage: React.FC = () => {
  const { products, toggleProductAvailability, toggleIngredientAvailability, addProduct, deleteProduct, updateProduct, ingredients: allIngredients, isAdmin } = useApp();
  const [confirmingProduct, setConfirmingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [confirmingIngredient, setConfirmingIngredient] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isUpdatingIngredient, setIsUpdatingIngredient] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductData, setEditingProductData] = useState<Product | null>(null);
  
  // New/Edit Product Form State
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageColor, setNewImageColor] = useState('#F27D26');
  const [newSelectedIngredients, setNewSelectedIngredients] = useState<string[]>([]);
  const [newYoutubeId, setNewYoutubeId] = useState('');
  const [newVideoStart, setNewVideoStart] = useState(0);
  const [newVideoEnd, setNewVideoEnd] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleClick = (productId: string) => {
    setConfirmingProduct(productId);
  };

  const handleConfirmToggle = async () => {
    if (!confirmingProduct) return;
    
    const productId = confirmingProduct;
    setConfirmingProduct(null);
    setIsUpdating(productId);
    
    try {
      await toggleProductAvailability(productId);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleIngredientToggleClick = (name: string) => {
    setConfirmingIngredient(name);
  };

  const handleConfirmIngredientToggle = async () => {
    if (!confirmingIngredient) return;
    
    const name = confirmingIngredient;
    setConfirmingIngredient(null);
    setIsUpdatingIngredient(name);
    
    try {
      await toggleIngredientAvailability(name);
    } finally {
      setIsUpdatingIngredient(null);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProductData(product);
    setNewName(product.name);
    setNewDescription(product.description);
    setNewImageColor(product.imageColor);
    setNewSelectedIngredients(product.ingredients);
    setNewYoutubeId(product.youtubeId || '');
    setNewVideoStart(product.videoStart || 0);
    setNewVideoEnd(product.videoEnd || 0);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductData || !newName.trim()) return;
    
    setIsSaving(true);
    try {
      await updateProduct(editingProductData.id, {
        name: newName.trim(),
        description: newDescription.trim(),
        imageColor: newImageColor,
        ingredients: newSelectedIngredients,
        youtubeId: newYoutubeId.trim() || undefined,
        videoStart: newVideoStart,
        videoEnd: newVideoEnd,
      });
      setShowEditModal(false);
      setEditingProductData(null);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setIsAdding(true);
    try {
      const id = newName.toLowerCase().replace(/\s+/g, '-');
      await addProduct({
        id,
        name: newName.trim(),
        description: newDescription.trim(),
        imageColor: newImageColor,
        ingredients: newSelectedIngredients,
        youtubeId: newYoutubeId.trim() || undefined,
        videoStart: newVideoStart,
        videoEnd: newVideoEnd,
      });
      setShowAddModal(false);
      resetForm();
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewImageColor('#F27D26');
    setNewSelectedIngredients([]);
    setNewYoutubeId('');
    setNewVideoStart(0);
    setNewVideoEnd(0);
  };

  const handleDeleteClick = (productId: string) => {
    setDeletingProduct(productId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    
    const id = deletingProduct;
    setDeletingProduct(null);
    setIsUpdating(id);
    
    try {
      await deleteProduct(id);
    } finally {
      setIsUpdating(null);
    }
  };

  const toggleIngredientSelection = (name: string) => {
    setNewSelectedIngredients(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const handleDeleteIngredientFromProduct = async (productId: string, ingredientName: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const updatedIngredients = product.ingredients.filter(ing => ing !== ingredientName);
    await updateProduct(productId, { ingredients: updatedIngredients });
  };

  const productToConfirm = products.find(p => p.id === confirmingProduct);

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
    <div className="space-y-8 pb-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-shadow-sm">Shot Recipes & Availability</h1>
        <p className="text-brand-brown mt-2 max-w-2xl mx-auto font-medium">
          Manage production guidelines and public availability for Living Water shots.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-green text-white font-bold px-8 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl flex items-center gap-3 active:scale-95"
        >
          <Plus size={24} />
          Create New Shot
        </button>
      </div>

      <div className="bg-brand-orange/5 border-l-4 border-brand-orange p-5 rounded-r-xl flex gap-4 items-start max-w-3xl mx-auto shadow-sm">
        <Info className="text-brand-orange flex-shrink-0 mt-1" size={24} />
        <div>
            <h4 className="font-bold text-brand-brown">Admin Control</h4>
            <p className="text-sm text-brand-brown/80 mt-1 leading-relaxed">
                Use the toggle in the header of each card to show or hide shots from the public ordering page. Check the "Stock" tab to manage raw materials.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {products.map(product => {
          const startTime = product.videoStart ?? 0;
          const endTime = product.videoEnd ?? 0;
          const videoSrc = `./tutorial.mp4#t=${startTime},${endTime}`;

          return (
            <div key={product.id} className={`bg-white rounded-3xl shadow-xl border overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl ${product.available ? 'border-brand-light-green/20' : 'border-gray-300 opacity-75'}`}>
              <div className={`${product.available ? 'bg-brand-green' : 'bg-gray-600'} p-5 flex items-center justify-between border-b border-white/10 transition-colors duration-300`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                      <Droplets className={product.available ? 'text-brand-orange' : 'text-gray-300'} size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-serif tracking-tight">{product.name}</h3>
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                      {product.available ? 'Currently Available' : 'Hidden from Store'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleClick(product.id)}
                    disabled={isUpdating === product.id}
                    title={product.available ? 'Hide from store' : 'Show in store'}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${product.available ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'bg-white text-gray-600 shadow-md'}`}
                  >
                    {isUpdating === product.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : product.available ? (
                      <><Eye size={14} /> Active</>
                    ) : (
                      <><EyeOff size={14} /> Inactive</>
                    )}
                  </button>

                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-2 text-white/60 hover:text-brand-orange transition-colors"
                    title="Edit Shot"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={() => handleDeleteClick(product.id)}
                    className="p-2 text-white/60 hover:text-red-400 transition-colors"
                    title="Delete Shot"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex-grow space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold text-brand-brown/60 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Scissors size={14} className="text-brand-orange" /> Video Instruction
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-brand-green/5 text-brand-green px-2.5 py-1 rounded-full font-bold border border-brand-green/10 flex items-center gap-1.5">
                          <Play size={10} className="fill-brand-orange text-brand-orange" />
                          {Math.floor(startTime / 60)}:{(startTime % 60).toString().padStart(2, '0')} - {Math.floor(endTime / 60)}:{(endTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  <LazyVideoPlayer 
                    src={videoSrc} 
                    youtubeId={product.youtubeId}
                    startTime={startTime} 
                    endTime={endTime} 
                    imageColor={product.imageColor} 
                  />
                  <p className="text-[9px] text-gray-400 text-center italic">
                    Segmented from official fundraiser tutorial
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="text-[10px] font-extrabold text-brand-brown/60 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Utensils size={14} className="text-brand-orange" /> Essential Ingredients
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {product.ingredients.map((ingredientName, idx) => {
                      const ingredientStatus = allIngredients.find(i => i.name === ingredientName);
                      const isUnavailable = ingredientStatus && !ingredientStatus.available;
                      
                      return (
                        <div key={idx} className={`flex items-center gap-3 text-sm p-3 rounded-xl border transition-colors group/ing ${isUnavailable ? 'bg-red-50 text-red-500 border-red-100 opacity-75' : 'text-gray-700 bg-brand-cream/10 border-brand-cream/20 hover:bg-brand-cream/20'}`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isUnavailable ? 'bg-red-500' : 'bg-brand-light-green'}`} />
                          <span className="font-medium">{ingredientName}</span>
                          <div className="ml-auto flex items-center gap-2">
                            {isUnavailable && <span className="text-[8px] font-bold uppercase tracking-tighter bg-red-100 px-1.5 py-0.5 rounded">Out of Stock</span>}
                            <button 
                              onClick={() => handleIngredientToggleClick(ingredientName)}
                              disabled={isUpdatingIngredient === ingredientName}
                              className={`p-1.5 rounded-lg transition-all opacity-0 group-hover/ing:opacity-100 focus:opacity-100 ${isUnavailable ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                              title={isUnavailable ? 'Mark as In Stock' : 'Mark as Out of Stock'}
                            >
                              {isUpdatingIngredient === ingredientName ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : isUnavailable ? (
                                <Eye size={12} />
                              ) : (
                                <EyeOff size={12} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteIngredientFromProduct(product.id, ingredientName)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all opacity-0 group-hover/ing:opacity-100 focus:opacity-100"
                              title="Remove Ingredient from Recipe"
                            >
                              <CloseIcon size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Benefit Profile</p>
                  <p className="text-sm text-brand-brown/80 leading-relaxed italic">
                      {product.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-brand-light-green animate-in zoom-in duration-200">
            <div className="bg-brand-green p-6 text-white flex justify-between items-center">
              <h3 className="text-2xl font-bold font-serif">Create New Shot</h3>
              <button onClick={() => setShowAddModal(false)} className="hover:text-brand-orange transition-colors">
                <CloseIcon size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Shot Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Turmeric Glow"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Theme Color (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newImageColor}
                      onChange={(e) => setNewImageColor(e.target.value)}
                      className="h-12 w-12 p-1 border border-gray-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newImageColor}
                      onChange={(e) => setNewImageColor(e.target.value)}
                      className="flex-grow p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Description / Benefits</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the health benefits..."
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Select Ingredients</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
                  {allIngredients.map(ing => (
                    <button
                      key={ing.name}
                      type="button"
                      onClick={() => toggleIngredientSelection(ing.name)}
                      className={`p-2 text-xs font-bold rounded-lg border transition-all ${newSelectedIngredients.includes(ing.name) ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-orange'}`}
                    >
                      {ing.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">YouTube ID (Optional)</label>
                  <input
                    type="text"
                    value={newYoutubeId}
                    onChange={(e) => setNewYoutubeId(e.target.value)}
                    placeholder="e.g., dQw4w9WgXcQ"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Video Start (sec)</label>
                  <input
                    type="number"
                    value={newVideoStart}
                    onChange={(e) => setNewVideoStart(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Video End (sec)</label>
                  <input
                    type="number"
                    value={newVideoEnd}
                    onChange={(e) => setNewVideoEnd(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-grow py-4 px-6 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !newName.trim() || newSelectedIngredients.length === 0}
                  className="flex-grow-[2] py-4 px-6 bg-brand-orange text-white font-bold rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-brand-orange/20 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {isAdding ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={20} />}
                  Create Shot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-brand-light-green animate-in zoom-in duration-200">
            <div className="bg-brand-orange p-6 text-white flex justify-between items-center">
              <h3 className="text-2xl font-bold font-serif">Edit Shot Recipe</h3>
              <button onClick={() => setShowEditModal(false)} className="hover:text-brand-green transition-colors">
                <CloseIcon size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Shot Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Theme Color (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newImageColor}
                      onChange={(e) => setNewImageColor(e.target.value)}
                      className="h-12 w-12 p-1 border border-gray-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newImageColor}
                      onChange={(e) => setNewImageColor(e.target.value)}
                      className="flex-grow p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Description / Benefits</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Select Ingredients</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
                  {allIngredients.map(ing => (
                    <button
                      key={ing.name}
                      type="button"
                      onClick={() => toggleIngredientSelection(ing.name)}
                      className={`p-2 text-xs font-bold rounded-lg border transition-all ${newSelectedIngredients.includes(ing.name) ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-orange'}`}
                    >
                      {ing.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">YouTube ID</label>
                  <input
                    type="text"
                    value={newYoutubeId}
                    onChange={(e) => setNewYoutubeId(e.target.value)}
                    placeholder="e.g., dQw4w9WgXcQ"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Video Start (sec)</label>
                  <input
                    type="number"
                    value={newVideoStart}
                    onChange={(e) => setNewVideoStart(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-brown uppercase tracking-widest">Video End (sec)</label>
                  <input
                    type="number"
                    value={newVideoEnd}
                    onChange={(e) => setNewVideoEnd(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-grow py-4 px-6 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newName.trim() || newSelectedIngredients.length === 0}
                  className="flex-grow-[2] py-4 px-6 bg-brand-green text-white font-bold rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-brand-green/20 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Products */}
      {confirmingProduct && productToConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-light-green animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-brand-green font-serif mb-2">Confirm Store Visibility</h3>
              <p className="text-brand-brown">
                Are you sure you want to {productToConfirm.available ? 'hide' : 'show'} <strong>{productToConfirm.name}</strong> {productToConfirm.available ? 'from' : 'in'} the public store?
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setConfirmingProduct(null)}
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

      {/* Delete Confirmation Modal for Products */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-red-200 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-red-800 font-serif mb-2">Delete Shot?</h3>
              <p className="text-gray-600">
                Are you sure you want to permanently delete <strong>{products.find(p => p.id === deletingProduct)?.name}</strong>? This will remove it from the store and all records.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setDeletingProduct(null)}
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

      {/* Confirmation Modal for Ingredients */}
      {confirmingIngredient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-light-green animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-brand-green font-serif mb-2">Confirm Ingredient Stock</h3>
              <p className="text-brand-brown">
                Are you sure you want to change the stock status of <strong>{confirmingIngredient}</strong>? This will affect all recipes using this ingredient.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setConfirmingIngredient(null)}
                  className="py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIngredientToggle}
                  className="py-3 px-4 bg-brand-green text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipesPage;