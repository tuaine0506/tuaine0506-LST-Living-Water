import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderSize } from '../types';
import { Check, Package, X, Utensils, Truck, RefreshCw, Heart, Edit2, ShoppingBag, ListChecks, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import NotificationModal from '../components/NotificationModal';
import ConfirmationModal from '../components/ConfirmationModal';
import EditOrderModal from '../components/EditOrderModal';
import OrderCard from '../components/OrderCard';

const FulfillmentPage: React.FC = () => {
  const { orders, products, toggleOrderFulfilled, updateOrder, ingredients: allIngredients, toggleIngredientAvailability } = useApp();
  const [notificationOrder, setNotificationOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);

  const isIngredientAvailable = (name: string) => {
    const cleanName = name.replace(/\s*\(optional\)\s*/i, '').trim();
    const ingredient = allIngredients.find(i => i.name === cleanName || i.name === name);
    return ingredient ? ingredient.available : true;
  };

  const getMissingIngredients = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    return product.ingredients.filter(ing => !isIngredientAvailable(ing) && !ing.toLowerCase().includes('(optional)'));
  };

  const unfulfilledOrders = orders.filter(order => !order.isFulfilled);
  const fulfilledOrders = orders.filter(order => order.isFulfilled);

  const productionSummary = useMemo(() => {
    const summary: { [key: string]: { [key in OrderSize]: number } } = {};
    unfulfilledOrders.forEach(order => {
      order.items.forEach(item => {
        if (!summary[item.productName]) {
          summary[item.productName] = { [OrderSize.SevenShots]: 0 };
        }
        const multiplier = order.isRecurring ? (4 - (order.recurringWeeksFulfilled || 0)) : 1;
        summary[item.productName][item.size] += (item.quantity * multiplier);
      });
    });
    return summary;
  }, [unfulfilledOrders]);

  const shoppingListData = useMemo(() => {
    const ingredientMap: { [ingredient: string]: { productNames: Set<string>, totalUnits: number } } = {};
    
    orders.forEach(order => {
      if (order.isFulfilled) return; // Only count unfulfilled orders for shopping list
      
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const multiplier = order.isRecurring ? (4 - (order.recurringWeeksFulfilled || 0)) : 1;
          const units = item.quantity * multiplier;
          
          product.ingredients.forEach(ingredient => {
            if (!ingredientMap[ingredient]) {
              ingredientMap[ingredient] = { productNames: new Set(), totalUnits: 0 };
            }
            ingredientMap[ingredient].productNames.add(product.name);
            ingredientMap[ingredient].totalUnits += units;
          });
        }
      });
    });

    return Object.entries(ingredientMap).sort((a, b) => b[1].totalUnits - a[1].totalUnits);
  }, [orders, products]);

  const handleFulfillClick = (order: Order) => {
    if (order.isFulfilled) {
        // If unfulfilling, just do it (or we could add confirmation here too, but user asked for "before fulfilling")
        toggleOrderFulfilled(order.id);
    } else {
        setConfirmingOrder(order);
    }
  };

  const handleConfirmFulfill = () => {
    if (confirmingOrder) {
        toggleOrderFulfilled(confirmingOrder.id);
        setNotificationOrder(confirmingOrder);
        setConfirmingOrder(null);
    }
  };

  const handleRecurringWeekToggle = (order: Order, weekIndex: number) => {
    const currentWeeks = order.recurringWeeksFulfilled || 0;
    // If clicking the next available week (e.g. current is 1, clicking week 2 (index 1))
    // Or if clicking to uncheck the last checked week
    
    let newWeeks = currentWeeks;
    if (weekIndex === currentWeeks) {
        newWeeks = currentWeeks + 1;
    } else if (weekIndex === currentWeeks - 1) {
        newWeeks = currentWeeks - 1;
    } else {
        return; // Can only toggle the immediate next or immediate previous week
    }

    updateOrder(order.id, { 
        recurringWeeksFulfilled: newWeeks,
        isFulfilled: newWeeks >= 4 
    });

    if (newWeeks > currentWeeks) {
        setNotificationOrder({
            ...order,
            recurringWeeksFulfilled: newWeeks,
            isFulfilled: newWeeks >= 4
        });
    }
  };



  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-green font-serif text-center">Order Fulfillment</h1>
        <p className="text-center text-brand-brown mt-2">Track, prepare, and fulfill customer orders.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-orange/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-brand-orange" />
            <h2 className="text-2xl font-bold text-brand-green font-serif">Weekly Shopping List</h2>
          </div>
          <div className="bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
            <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">Aggregate (Fulfilled + Pending)</p>
          </div>
        </div>
        
        {shoppingListData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shoppingListData.map(([ingredient, data]) => {
              const available = isIngredientAvailable(ingredient);
              return (
                <div 
                  key={ingredient} 
                  onClick={() => toggleIngredientAvailability(ingredient)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all group cursor-pointer ${available ? 'bg-gray-50 border-gray-100 hover:border-brand-orange/30' : 'bg-red-50 border-red-200 shadow-sm'}`}
                >
                  <div className="mt-1">
                    <div className={`w-5 h-5 rounded border-2 transition-colors ${available ? 'border-brand-light-green group-hover:border-brand-orange' : 'border-red-500 bg-red-100'}`}>
                      {!available && <Check size={16} className="text-red-500" />}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <p className={`font-bold leading-tight ${available ? 'text-brand-brown' : 'text-red-700'}`}>{ingredient}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${available ? 'bg-white text-brand-green' : 'bg-red-100 text-red-600 border-red-200'}`}>
                        {data.totalUnits} items
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-1 italic ${available ? 'text-gray-500' : 'text-red-500 font-medium'}`}>
                      {available ? `Needed for: ${Array.from(data.productNames).join(', ')}` : 'OUT OF STOCK - NEEDS PURCHASE'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
            <ListChecks className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500 italic">No orders currently active. Shopping list is empty.</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
        <div className="flex items-center gap-3 mb-4">
          <Utensils className="h-8 w-8 text-brand-orange" />
          <h2 className="text-2xl font-bold text-brand-green font-serif">Production Summary</h2>
        </div>
        {Object.keys(productionSummary).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(productionSummary).map(([productName, sizes]) => (
              <div key={productName} className="bg-gray-50 p-3 rounded-lg border">
                <p className="font-bold text-brand-brown">{productName}</p>
                <ul className="text-sm mt-1">
                  {sizes[OrderSize.SevenShots] > 0 && <li>{sizes[OrderSize.SevenShots]} x 7-Packs</li>}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending orders to produce.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-8 w-8 text-brand-orange" />
          <h2 className="text-2xl font-bold text-brand-green font-serif">Pending Orders ({unfulfilledOrders.length})</h2>
        </div>
        {unfulfilledOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unfulfilledOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onEdit={setEditingOrder}
                onStatusToggle={handleFulfillClick}
                onRecurringWeekToggle={handleRecurringWeekToggle}
                getMissingIngredients={getMissingIngredients}
                initiallyExpanded={true}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">All orders have been fulfilled!</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-light-green/50">
        <div className="flex items-center gap-3 mb-4">
          <Check className="h-8 w-8 text-green-600" />
          <h2 className="text-2xl font-bold text-brand-green font-serif">Fulfilled Orders ({fulfilledOrders.length})</h2>
        </div>
         {fulfilledOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fulfilledOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                isFulfilledView 
                onEdit={setEditingOrder}
                onStatusToggle={handleFulfillClick}
                onRecurringWeekToggle={handleRecurringWeekToggle}
                getMissingIngredients={getMissingIngredients}
              />
            ))}
          </div>
        ) : (
           <p className="text-gray-500">No orders fulfilled yet.</p>
        )}
      </div>

      <NotificationModal 
        order={notificationOrder}
        onClose={() => setNotificationOrder(null)}
      />

      <EditOrderModal
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
      />

      <ConfirmationModal
        isOpen={!!confirmingOrder}
        title="Confirm Fulfillment"
        message={`Are you sure you want to mark the order for ${confirmingOrder?.customerName} as fulfilled? This will move it to the Fulfilled Orders section.`}
        onConfirm={handleConfirmFulfill}
        onCancel={() => setConfirmingOrder(null)}
      />
    </div>
  );
};

export default FulfillmentPage;