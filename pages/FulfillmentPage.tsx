import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderSize } from '../types';
import { Check, Package, X, Utensils, Truck, RefreshCw, Heart, Edit2, ShoppingBag, ListChecks, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import NotificationModal from '../components/NotificationModal';
import EditOrderModal from '../components/EditOrderModal';

const FulfillmentPage: React.FC = () => {
  const { orders, products, toggleOrderFulfilled, updateOrder, ingredients: allIngredients } = useApp();
  const [notificationOrder, setNotificationOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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
    toggleOrderFulfilled(order.id);
    if (!order.isFulfilled) {
        setNotificationOrder(order);
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

    if (newWeeks >= 4) {
        setNotificationOrder(order);
    }
  };

  interface OrderCardProps {
    order: Order;
    isFulfilledView?: boolean;
  }

  const OrderCard: React.FC<OrderCardProps> = ({ order, isFulfilledView = false }) => (
    <div className={`p-4 rounded-lg shadow-md ${isFulfilledView ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} border flex flex-col justify-between relative`}>
      {!isFulfilledView && (
        <button 
          onClick={() => setEditingOrder(order)}
          className="absolute top-2 right-2 p-1.5 text-brand-green hover:bg-brand-cream rounded-md transition-colors"
          title="Edit Order"
        >
          <Edit2 size={16} />
        </button>
      )}
      <div>
        <div className="flex justify-between items-start">
          <div className="pr-6">
            <p className="font-bold text-brand-green">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerContact}</p>
            {order.customerEmail && (
               <p className="text-xs text-brand-orange flex items-center gap-1 mt-0.5 font-medium truncate">
                <Mail size={12} /> {order.customerEmail}
               </p>
            )}
            <p className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-2">#{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-brand-orange">${order.totalPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Zelle Conf #: <span className="font-medium text-gray-700">{order.zelleConfirmationNumber}</span>
        </div>
        
        <div className="mt-2 border-t pt-2 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-2 text-sm font-semibold px-2 py-1 rounded-full ${order.deliveryOption === 'Delivery' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {order.deliveryOption === 'Delivery' ? <Truck size={14} /> : <Package size={14} />}
                    {order.deliveryOption}
                </div>
                 {order.isRecurring && (
                    <div className="inline-flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full bg-teal-100 text-teal-800">
                        <RefreshCw size={14} /> Recurring
                    </div>
                 )}
            </div>

          {order.deliveryOption === 'Delivery' && order.deliveryAddress && (
            <p className="text-xs text-gray-600 pl-1 border-l-2 ml-1">{order.deliveryAddress}</p>
          )}
        </div>
        
        <div className="mt-4 space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Details</p>
          {order.items.map((item, index) => {
            const missing = getMissingIngredients(item.productId);
            return (
              <div key={index} className={`p-2 rounded-lg border ${missing.length > 0 ? 'bg-red-50 border-red-200' : 'bg-brand-cream/10 border-brand-cream/20'}`}>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-brand-brown">{item.quantity}x {item.productName}</span>
                  <span className="text-[10px] bg-white px-1.5 rounded border">7PK</span>
                </div>
                {missing.length > 0 && (
                  <p className="text-[9px] text-red-600 font-bold mt-1 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                    Missing: {missing.join(', ')}
                  </p>
                )}
                {item.selectedOptionalIngredients && item.selectedOptionalIngredients.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.selectedOptionalIngredients.map((opt, i) => (
                      <span key={i} className="flex items-center gap-0.5 text-[9px] bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded-full border border-brand-orange/20 font-bold">
                         <CheckCircle2 size={10} /> {opt.replace(/\s*\(optional\)\s*/i, '').trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {order.donationAmount > 0 && (
            <div className="text-brand-orange font-bold text-xs flex items-center gap-1 mt-1 bg-brand-orange/5 p-2 rounded-lg border border-brand-orange/10">
                <Heart size={14} /> Donation: ${order.donationAmount.toFixed(2)}
            </div>
          )}
        </div>
      </div>
      
      {order.isRecurring ? (
        <div className="mt-4 bg-teal-50 p-3 rounded-lg border border-teal-100">
            <p className="text-xs font-bold text-teal-800 mb-2 flex items-center gap-1">
                <RefreshCw size={12} /> Recurring Progress
            </p>
            <div className="flex justify-between gap-1">
                {[0, 1, 2, 3].map((weekIdx) => {
                    const isCompleted = (order.recurringWeeksFulfilled || 0) > weekIdx;
                    const isNext = (order.recurringWeeksFulfilled || 0) === weekIdx;
                    const date = order.recurringDates?.[weekIdx];
                    const formattedDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '';

                    return (
                        <button
                            key={weekIdx}
                            onClick={() => !isFulfilledView && handleRecurringWeekToggle(order, weekIdx)}
                            disabled={isFulfilledView || (!isCompleted && !isNext)}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-colors flex flex-col items-center gap-0.5 ${
                                isCompleted 
                                    ? 'bg-teal-500 text-white border-teal-600' 
                                    : isNext && !isFulfilledView
                                        ? 'bg-white text-teal-600 border-teal-300 hover:bg-teal-50'
                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                        >
                            <span>Wk {weekIdx + 1}</span>
                            {formattedDate && <span className="text-[8px] opacity-80">{formattedDate}</span>}
                        </button>
                    );
                })}
            </div>
            {isFulfilledView && (
                 <button
                    onClick={() => handleFulfillClick(order)}
                    className="w-full mt-2 py-1.5 px-4 rounded font-semibold text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border border-yellow-200 flex items-center justify-center transition-colors"
                >
                    <X className="mr-1 h-3 w-3" /> Mark Unfulfilled
                </button>
            )}
        </div>
      ) : (
        <button
            onClick={() => handleFulfillClick(order)}
            className={`w-full mt-4 py-2 px-4 rounded-lg font-semibold text-white flex items-center justify-center transition-colors ${
            isFulfilledView ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
            }`}
        >
            {isFulfilledView ? <><X className="mr-2 h-4 w-4" />Mark as Unfulfilled</> : <><Check className="mr-2 h-4 w-4" />Mark as Fulfilled</>}
        </button>
      )}
    </div>
  );

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
                <div key={ingredient} className={`flex items-start gap-3 p-3 rounded-xl border transition-all group ${available ? 'bg-gray-50 border-gray-100 hover:border-brand-orange/30' : 'bg-red-50 border-red-200 shadow-sm'}`}>
                  <div className="mt-1">
                    <div className={`w-5 h-5 rounded border-2 transition-colors ${available ? 'border-brand-light-green group-hover:border-brand-orange' : 'border-red-500 bg-red-100'}`} />
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
            {unfulfilledOrders.map(order => <OrderCard key={order.id} order={order} />)}
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
            {fulfilledOrders.map(order => <OrderCard key={order.id} order={order} isFulfilledView />)}
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
    </div>
  );
};

export default FulfillmentPage;