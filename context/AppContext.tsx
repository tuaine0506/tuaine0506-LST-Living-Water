import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Order, CartItem, GroupName, OrderSize, ProductPrices, ScheduleEvent, DeliveryOption, Ingredient, Volunteer, VolunteerAvailability } from '../types';
import { PRODUCTS, GROUP_NAMES } from '../constants';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

interface AppContextType {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  cartId: string | null;
  donationAmount: number;
  schedule: ScheduleEvent[];
  isAdmin: boolean;
  notifications: Notification[];
  ingredients: Ingredient[];
  volunteers: Volunteer[];
  availability: VolunteerAvailability[];
  isDeliveryEnabled: boolean;
  addToCart: (productId: string, size: OrderSize, quantity: number, optionalIngredients: string[]) => void;
  removeFromCart: (productId: string, size: OrderSize, optionalIngredients: string[]) => void;
  updateCartQuantity: (productId: string, size: OrderSize, optionalIngredients: string[], quantity: number) => void;
  setDonationAmount: (amount: number) => void;
  clearCart: () => void;
  placeOrder: (customerName: string, customerContact: string, customerEmail: string, deliveryOption: DeliveryOption, deliveryAddress: string | undefined, zelleConfirmationNumber: string, isRecurring: boolean, recurringDates?: string[]) => void;
  updateOrder: (orderId: string, updatedData: Partial<Order>) => void;
  toggleOrderFulfilled: (orderId: string) => void;
  login: (password?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  toggleProductAvailability: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  toggleIngredientAvailability: (ingredientName: string) => void;
  toggleDeliveryEnabled: () => void;
  resetProducts: () => Promise<{ success: boolean; error?: string }>;
  addProduct: (product: Omit<Product, 'available'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addIngredient: (ingredient: Omit<Ingredient, 'available'>) => Promise<void>;
  deleteIngredient: (name: string) => Promise<void>;
  dismissNotification: (id: string) => void;
  addVolunteer: (volunteer: Omit<Volunteer, 'id'>) => Promise<void>;
  updateVolunteer: (id: string, updates: Partial<Volunteer>) => Promise<void>;
  deleteVolunteer: (id: string) => Promise<void>;
  addAvailability: (avail: Omit<VolunteerAvailability, 'id'>) => Promise<void>;
  updateAvailability: (id: string, updates: Partial<VolunteerAvailability>) => Promise<void>;
  deleteAvailability: (id: string) => Promise<void>;
  addNotification: (message: string, type: 'info' | 'success' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [cartId, setCartId] = useLocalStorage<string | null>('cartId', null);
  const [donationAmount, setDonationAmount] = useLocalStorage<number>('donationAmount', 0);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('isAdmin', false);
  const [adminToken, setAdminToken] = useLocalStorage<string | null>('adminToken', null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [availability, setAvailability] = useState<VolunteerAvailability[]>([]);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState<boolean>(false);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, message, type, timestamp: Date.now() }, ...prev]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    // Initial fetch of orders and products
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Failed to fetch orders:', err));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setProducts(data);
        } else {
          // Sync local products to server if server is empty
          fetch('/api/products/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(PRODUCTS),
          });
        }
      })
      .catch(err => console.error('Failed to fetch products:', err));

    fetch('/api/ingredients')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setIngredients(data);
        } else {
          // Extract unique ingredients from PRODUCTS
          const uniqueIngredients = Array.from(new Set(PRODUCTS.flatMap(p => p.ingredients)));
          const initialIngredients: Ingredient[] = uniqueIngredients.map(name => ({ name, available: true }));
          
          fetch('/api/ingredients/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialIngredients),
          });
        }
      })
      .catch(err => console.error('Failed to fetch ingredients:', err));

    fetch('/api/volunteers')
      .then(res => res.json())
      .then(data => setVolunteers(data))
      .catch(err => console.error('Failed to fetch volunteers:', err));

    fetch('/api/availability')
      .then(res => res.json())
      .then(data => setAvailability(data))
      .catch(err => console.error('Failed to fetch availability:', err));

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setIsDeliveryEnabled(data.isDeliveryEnabled))
      .catch(err => console.error('Failed to fetch settings:', err));

    // Verify admin session if token exists
    const token = window.localStorage.getItem('adminToken');
    if (token) {
      const parsedToken = JSON.parse(token);
      if (parsedToken) {
        fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: parsedToken }),
        })
        .then(res => {
          if (!res.ok) {
            setIsAdmin(false);
            setAdminToken(null);
          } else {
            setIsAdmin(true);
          }
        })
        .catch(() => {
          // If network error, we keep the local state but maybe we should be more careful
        });
      }
    }

    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'INIT_DATA':
          setOrders(data.payload.orders);
          if (data.payload.products.length > 0) {
            setProducts(data.payload.products);
          }
          if (data.payload.ingredients.length > 0) {
            setIngredients(data.payload.ingredients);
          }
          if (data.payload.volunteers.length > 0) {
            setVolunteers(data.payload.volunteers);
          }
          if (data.payload.availability.length > 0) {
            setAvailability(data.payload.availability);
          }
          setIsDeliveryEnabled(data.payload.isDeliveryEnabled);
          break;
        case 'INIT_ORDERS':
          setOrders(data.payload);
          break;
        case 'NEW_ORDER':
          setOrders(prev => [...prev, data.payload]);
          addNotification(`New order received from ${data.payload.customerName}!`, 'success');
          break;
        case 'UPDATE_ORDER':
          setOrders(prev => prev.map(o => o.id === data.payload.id ? data.payload : o));
          break;
        case 'UPDATE_PRODUCTS':
          setProducts(data.payload);
          break;
        case 'UPDATE_INGREDIENTS':
          setIngredients(data.payload);
          break;
        case 'UPDATE_VOLUNTEERS':
          setVolunteers(data.payload);
          break;
        case 'UPDATE_AVAILABILITY':
          setAvailability(data.payload);
          break;
        case 'UPDATE_SETTINGS':
          setIsDeliveryEnabled(data.payload.isDeliveryEnabled);
          break;
        case 'NOTIFICATION':
          addNotification(data.payload.message, 'info');
          break;
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const generateSchedule = () => {
        const upcomingSundays: ScheduleEvent[] = [];
        let currentDate = new Date();
        let sundaysFound = 0;
        while (sundaysFound < 8) {
            currentDate.setDate(currentDate.getDate() + 1);
            if (currentDate.getDay() === 0) {
                upcomingSundays.push({
                    date: currentDate.toISOString(),
                    group: GROUP_NAMES[sundaysFound % GROUP_NAMES.length]
                });
                sundaysFound++;
            }
        }
        setSchedule(upcomingSundays);
    };
    generateSchedule();
  }, []);

  const login = async (password?: string): Promise<boolean> => {
    try {
      if (!password) {
        return false;
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setAdminToken(data.token);
        }
        setIsAdmin(true);
        return true;
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
    return false;
  };

  const logout = async () => {
    try {
      if (adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: adminToken }),
        });
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setIsAdmin(false);
    setAdminToken(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        addNotification('Password changed successfully!', 'success');
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      console.error('Change password failed:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const toggleProductAvailability = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !product.available }),
      });
      if (!response.ok) {
        throw new Error('Failed to update product availability');
      }
    } catch (err) {
      console.error('Failed to update product availability:', err);
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  // Auto-update product descriptions from constants if they match the old default
  useEffect(() => {
    if (products.length === 0) return;
    
    const OLD_DESCRIPTIONS: Record<string, string> = {
      'lemon-ginger': 'A classic immune booster to kickstart your day with a zesty punch.',
      'berry-beet': 'A vibrant, earthy shot designed to enhance energy and stamina.',
      'pineapple-mint': 'A refreshing tropical blend that aids digestion and soothes the senses.',
      'mixed-berry': 'Packed with antioxidants to fight free radicals and support overall health.',
      'carrot-apple': 'A sweet and spicy combination rich in vitamins and anti-inflammatory properties.',
      'everything-green': 'A potent dose of greens to mineralize your body and boost vitality.',
      'elderberry-zinc': 'A potent blend to strengthen immunity and fight off illness.',
    };

    PRODUCTS.forEach(constProduct => {
      const existingProduct = products.find(p => p.id === constProduct.id);
      // Update if it matches the old description OR if it's empty
      if (existingProduct && (existingProduct.description === OLD_DESCRIPTIONS[constProduct.id] || !existingProduct.description)) {
        console.log(`Updating description for ${constProduct.name}`);
        updateProduct(existingProduct.id, { description: constProduct.description });
      }
    });
  }, [products]);

  const toggleIngredientAvailability = async (ingredientName: string) => {
    const ingredient = ingredients.find(i => i.name === ingredientName);
    if (!ingredient) return;

    try {
      const response = await fetch(`/api/ingredients/${encodeURIComponent(ingredientName)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !ingredient.available }),
      });
      if (!response.ok) {
        throw new Error('Failed to update ingredient availability');
      }
    } catch (err) {
      console.error('Failed to update ingredient availability:', err);
    }
  };

  const toggleDeliveryEnabled = async () => {
    try {
      const response = await fetch('/api/settings/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isDeliveryEnabled }),
      });
      if (!response.ok) {
        throw new Error('Failed to update delivery settings');
      }
    } catch (err) {
      console.error('Failed to toggle delivery:', err);
    }
  };

  const resetProducts = async () => {
    try {
      const response = await fetch('/api/products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(PRODUCTS),
      });
      if (response.ok) {
        const updatedProducts = await response.json();
        setProducts(updatedProducts);
        return { success: true };
      }
      return { success: false, error: 'Failed to sync products' };
    } catch (error) {
      console.error('Error resetting products:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const addProduct = async (product: Omit<Product, 'available'>) => {
    try {
      const newProduct = { ...product, available: false };
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
    } catch (err) {
      console.error('Failed to add product:', err);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const addIngredient = async (ingredient: Omit<Ingredient, 'available'>) => {
    try {
      const newIngredient = { ...ingredient, available: true };
      await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIngredient),
      });
    } catch (err) {
      console.error('Failed to add ingredient:', err);
    }
  };

  const deleteIngredient = async (name: string) => {
    try {
      await fetch(`/api/ingredients/${encodeURIComponent(name)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete ingredient:', err);
    }
  };

  const addToCart = (productId: string, size: OrderSize, quantity: number, optionalIngredients: string[]) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (!cartId) {
        setCartId(`LW-${Date.now().toString().slice(-6)}`);
    }

    setCart(prevCart => {
      // Check for same product, same size, AND same optional ingredients to group them
      const existingItem = prevCart.find(item => 
        item.productId === productId && 
        item.size === size && 
        JSON.stringify(item.selectedOptionalIngredients) === JSON.stringify(optionalIngredients)
      );

      if (existingItem) {
        return prevCart.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { 
          productId, 
          productName: product.name, 
          size, 
          quantity, 
          selectedOptionalIngredients: optionalIngredients 
        }];
      }
    });
  };

  const removeFromCart = (productId: string, size: OrderSize, optionalIngredients: string[]) => {
    setCart(prevCart => {
        const newCart = prevCart.filter(item => !(
          item.productId === productId && 
          item.size === size && 
          JSON.stringify(item.selectedOptionalIngredients) === JSON.stringify(optionalIngredients)
        ));
        if (newCart.length === 0 && donationAmount <= 0) {
            setCartId(null);
        }
        return newCart;
    });
  };

  const updateCartQuantity = (productId: string, size: OrderSize, optionalIngredients: string[], quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, optionalIngredients);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId && 
          item.size === size && 
          JSON.stringify(item.selectedOptionalIngredients) === JSON.stringify(optionalIngredients)
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setCartId(null);
    setDonationAmount(0);
  };

  const placeOrder = async (
    customerName: string, 
    customerContact: string, 
    customerEmail: string, 
    deliveryOption: DeliveryOption, 
    deliveryAddress: string | undefined, 
    zelleConfirmationNumber: string, 
    isRecurring: boolean, 
    recurringDates?: string[]
  ) => {
    let currentId = cartId;
    if (!currentId) {
        currentId = `LW-${Date.now().toString().slice(-6)}`;
    }
    
    const finalProductPrice = isRecurring 
      ? cart.reduce((total, item) => total + (120 * item.quantity), 0)
      : cart.reduce((total, item) => total + (ProductPrices[item.size] * item.quantity), 0);
    
    const finalPrice = finalProductPrice + donationAmount;

    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      customerName,
      customerContact,
      customerEmail: customerEmail || undefined,
      items: [...cart],
      donationAmount: donationAmount,
      assignedGroup: GROUP_NAMES[Math.floor(Math.random() * GROUP_NAMES.length)],
      orderDate: new Date().toISOString(),
      isFulfilled: false,
      totalPrice: finalPrice,
      deliveryOption,
      deliveryAddress,
      orderNumber: currentId,
      zelleConfirmationNumber,
      isRecurring,
      recurringWeeksFulfilled: isRecurring ? 0 : undefined,
      recurringDates: isRecurring ? recurringDates : undefined,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      if (response.ok) {
        clearCart();
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  const updateOrder = async (orderId: string, updatedData: Partial<Order>) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };
  
  const toggleOrderFulfilled = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      updateOrder(orderId, { isFulfilled: !order.isFulfilled });
    }
  };

  const addVolunteer = async (volunteer: Omit<Volunteer, 'id'>) => {
    const newVolunteer = { ...volunteer, id: `vol-${Date.now()}` };
    try {
      await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVolunteer),
      });
    } catch (err) {
      console.error('Failed to add volunteer:', err);
    }
  };

  const updateVolunteer = async (id: string, updates: Partial<Volunteer>) => {
    try {
      await fetch(`/api/volunteers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update volunteer:', err);
    }
  };

  const deleteVolunteer = async (id: string) => {
    try {
      await fetch(`/api/volunteers/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete volunteer:', err);
    }
  };

  const addAvailability = async (avail: Omit<VolunteerAvailability, 'id'>) => {
    const newAvail = { ...avail, id: `avail-${Date.now()}` };
    try {
      await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAvail),
      });
    } catch (err) {
      console.error('Failed to add availability:', err);
    }
  };

  const updateAvailability = async (id: string, updates: Partial<VolunteerAvailability>) => {
    try {
      await fetch(`/api/availability/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  const deleteAvailability = async (id: string) => {
    try {
      await fetch(`/api/availability/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete availability:', err);
    }
  };

  return (
    <AppContext.Provider value={{ products, orders, cart, cartId, donationAmount, setDonationAmount, schedule, isAdmin, notifications, ingredients, volunteers, availability, isDeliveryEnabled, addToCart, removeFromCart, updateCartQuantity, clearCart, placeOrder, updateOrder, toggleOrderFulfilled, login, logout, changePassword, toggleProductAvailability, updateProduct, toggleIngredientAvailability, toggleDeliveryEnabled, resetProducts, addProduct, deleteProduct, addIngredient, deleteIngredient, dismissNotification, addVolunteer, updateVolunteer, deleteVolunteer, addAvailability, updateAvailability, deleteAvailability, addNotification }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};