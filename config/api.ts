/**
 * API Configuration for CafeOS Backend
 * Connect to backend at http://localhost:5173 (or custom port via PORT env var)
 */

// Backend Base URL - uses environment variable or defaults to 5173
// This matches the backend server configuration
// NOTE: Auth.tsx adds /api/auth/... so base URL should NOT include /api
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5173';

/**
 * Fetch all tables from backend
 */
export const fetchTables = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tables`);
    if (!response.ok) throw new Error('Failed to fetch tables');
    const data = await response.json();
    return data.tables || [];
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
};

/**
 * Fetch all orders from backend
 */
export const fetchOrders = async (status?: string) => {
  try {
    const url = status 
      ? `${API_BASE_URL}/orders?status=${status}`
      : `${API_BASE_URL}/orders`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

/**
 * Create a new order
 */
export const createOrder = async (tableId: number, items: any[], totalAmount: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: tableId,
        items: items,
        total_amount: totalAmount
      })
    });
    if (!response.ok) throw new Error('Failed to create order');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Get specific order details
 */
export const getOrder = async (orderId: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    const data = await response.json();
    return data.order || null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

/**
 * Update order status (for kitchen)
 */
export const updateOrderStatus = async (orderId: number, status: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return await response.json();
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Update table status
 */
export const updateTableStatus = async (tableId: number, status: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update table status');
    return await response.json();
  } catch (error) {
    console.error('Error updating table status:', error);
    throw error;
  }
};

/**
 * Get orders for a specific table
 */
export const getTableOrders = async (tableId: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}/orders`);
    if (!response.ok) throw new Error('Failed to fetch table orders');
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching table orders:', error);
    return [];
  }
};

/**
 * Record a payment
 */
export const recordPayment = async (orderId: number, amount: number, paymentMethod: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        amount: amount,
        payment_method: paymentMethod,
        payment_status: 'completed'
      })
    });
    if (!response.ok) throw new Error('Failed to record payment');
    return await response.json();
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

/**
 * Get dashboard summary
 */
export const getDashboardSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
    if (!response.ok) throw new Error('Failed to fetch dashboard summary');
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return null;
  }
};

/**
 * Get all payments
 */
export const fetchPayments = async (orderId?: number) => {
  try {
    const url = orderId
      ? `${API_BASE_URL}/payments?order_id=${orderId}`
      : `${API_BASE_URL}/payments`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch payments');
    const data = await response.json();
    return data.payments || [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};
