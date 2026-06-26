import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Order, OrderStatus, Table, INITIAL_TABLES, TableStatus, User, UserRole } from '../types';
import { clearJWTToken } from '../utils/jwt';

interface CafeContextType extends AppState {
  login: (user: User) => void;
  logout: () => void;
  setOnlineMode: (enabled: boolean) => void;
  updateTableStatus: (tableId: number, status: TableStatus) => void;
  placeOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  generateBill: (orderId: string) => void;
  resetTable: (tableId: number) => void;
  addNotification: (msg: string) => void;
  refreshData: () => void;
}

const CafeContext = createContext<CafeContextType | null>(null);

const STORAGE_KEY = 'cafe_os_db_v1';
const SESSION_KEY = 'cafe_os_session_v1';

const getInitialState = (): AppState => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  const storedSession = localStorage.getItem(SESSION_KEY);
  
  const baseState = storedData ? JSON.parse(storedData) : {
    isOnlineMode: false,
    tables: INITIAL_TABLES,
    orders: [],
    notifications: []
  };

  return {
    ...baseState,
    currentUser: storedSession ? JSON.parse(storedSession) : null
  };
};

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);

  // Sync data to local storage (excluding currentUser)
  useEffect(() => {
    const { currentUser, ...dataToStore } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  }, [state]);

  // Sync session to local storage separately
  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [state.currentUser]);

  // Listen for storage events (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newData = JSON.parse(e.newValue);
        setState(prev => ({
          ...prev,
          ...newData
        }));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    // Store JWT token if provided
    if (user.token) {
      localStorage.setItem('jwt_token', user.token);
    }
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    // Clear JWT token on logout
    clearJWTToken();
    localStorage.removeItem('jwt_token');
  };

  const setOnlineMode = (enabled: boolean) => {
    setState(prev => ({ ...prev, isOnlineMode: enabled }));
  };

  const updateTableStatus = (tableId: number, status: TableStatus) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === tableId ? { ...t, status } : t)
    }));
  };

  const placeOrder = (order: Order) => {
    setState(prev => ({
      ...prev,
      orders: [...prev.orders, { ...order, customerName: prev.currentUser?.name || 'Guest' }],
      tables: prev.tables.map(t => 
        t.id === order.tableId 
          ? { ...t, status: TableStatus.OCCUPIED, currentOrderId: order.id } 
          : t
      )
    }));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setState(prev => {
      const updatedOrders = prev.orders.map(o => o.id === orderId ? { ...o, status } : o);
      
      let notif = prev.notifications;
      if (status === OrderStatus.READY) {
         const order = prev.orders.find(o => o.id === orderId);
         if (order) {
            notif = [...notif, { id: Date.now().toString(), message: `Order for Table ${order.tableId} is Ready!`, type: 'success' }];
         }
      }

      return {
        ...prev,
        orders: updatedOrders,
        notifications: notif
      };
    });
  };

  const generateBill = (orderId: string) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, isBillGenerated: true } : o)
    }));
  };

  const resetTable = (tableId: number) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.EMPTY, currentOrderId: undefined } : t),
      orders: prev.orders.map(o => (o.tableId === tableId && o.status !== OrderStatus.COMPLETED) ? { ...o, status: OrderStatus.COMPLETED } : o)
    }));
  };

  const addNotification = (msg: string) => {
    // Placeholder
  };
  
  const refreshData = () => {
      const currentUser = state.currentUser;
      const initial = getInitialState();
      setState({ ...initial, currentUser });
  }

  return (
    <CafeContext.Provider value={{
      ...state,
      login,
      logout,
      setOnlineMode,
      updateTableStatus,
      placeOrder,
      updateOrderStatus,
      generateBill,
      resetTable,
      addNotification,
      refreshData
    }}>
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) throw new Error('useCafe must be used within CafeProvider');
  return context;
};