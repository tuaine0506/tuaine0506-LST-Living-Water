import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Order, CartItem, GroupName, OrderSize, ProductPrices, ScheduleEvent, DeliveryOption } from '../types';
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
  addToCart: (productId: string, size: OrderSize, quantity: number, optionalIngredients: string[]) => void;
  removeFromCart: (productId: string, size: OrderSize) => void;
  updateCartQuantity: (productId: string, size: OrderSize, quantity: number) => void;
  setDonationAmount: (amount: number) => void;
  clearCart: () => void;
  placeOrder: (customerName: string, customerContact: string, customerEmail: string, deliveryOption: DeliveryOption, deliveryAddress: string | undefined, zelleConfirmationNumber: string, isRecurring: boolean) => void;
  updateOrder: (orderId: string, updatedData: Partial<Order>) => void;
  toggleOrderFulfilled: (orderId: string) => void;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  toggleProductAvailability: (productId: string) => void;
  dismissNotification: (id: string) => void;
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
  const [products, setProducts] = useLocalStorage<Product[]>('products', PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [cartId, setCartId] = useLocalStorage<string | null>('cartId', null);
  const [donationAmount, setDonationAmount] = useLocalStorage<number>('donationAmount', 0);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('isAdmin', false);
  const [adminPassword, setAdminPassword] = useLocalStorage<string>('adminPassword', 'admin123');
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const login = (password: string): boolean => {
    if (password === adminPassword) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
  };

  const changePassword = (newPassword: string) => {
    setAdminPassword(newPassword);
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

  const removeFromCart = (productId: string, size: OrderSize) => {
    setCart(prevCart => {
        const newCart = prevCart.filter(item => !(item.productId === productId && item.size === size));
        if (newCart.length === 0 && donationAmount <= 0) {
            setCartId(null);
        }
        return newCart;
    });
  };

  const updateCartQuantity = (productId: string, size: OrderSize, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId && item.size === size
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

  const placeOrder = async (customerName: string, customerContact: string, customerEmail: string, deliveryOption: DeliveryOption, deliveryAddress: string | undefined, zelleConfirmationNumber: string, isRecurring: boolean) => {
    let currentId = cartId;
    if (!currentId) {
        currentId = `LW-${Date.now().toString().slice(-6)}`;
    }
    
    const baseTotal = cart.reduce((total, item) => {
        return total + (ProductPrices[item.size] * item.quantity);
    }, 0);

    const finalProductPrice = isRecurring ? baseTotal * 4 : baseTotal;
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

  return (
    <AppContext.Provider value={{ products, orders, cart, cartId, donationAmount, setDonationAmount, schedule, isAdmin, notifications, addToCart, removeFromCart, updateCartQuantity, clearCart, placeOrder, updateOrder, toggleOrderFulfilled, login, logout, changePassword, toggleProductAvailability, dismissNotification }}>
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