/**
 * 📅 Calendar Heatmap Component
 * ================================
 * 
 * Analytics visualization showing daily order volume
 * Similar to GitHub contribution graph, styled with CafeOS colors
 * 
 * Features:
 * - Monthly calendar view
 * - Color intensity based on order count
 * - Hover tooltips with date and order count
 * - Responsive grid layout
 * - Auto-updates when orders change
 */

import React, { useMemo } from 'react';
import { Order } from '../types';

interface CalendarHeatmapProps {
  orders: Order[];
  className?: string;
}

interface DayData {
  date: Date;
  orderCount: number;
  dateString: string;
}

/**
 * Get color based on order count (heatmap intensity)
 * Using CafeOS theme colors: cafe-100 (light) → cafe-900 (dark)
 */
function getColorForOrderCount(count: number, maxOrders: number): string {
  if (count === 0) return '#fdf8f6'; // Very light cafe-50
  if (count <= maxOrders * 0.2) return '#f5f0e8'; // cafe-100
  if (count <= maxOrders * 0.4) return '#e8d7c3'; // cafe-200
  if (count <= maxOrders * 0.6) return '#d6c8b0'; // cafe-300
  if (count <= maxOrders * 0.8) return '#c2b09c'; // cafe-400
  return '#8b6f47'; // cafe-900 (darkest)
}

/**
 * Generate all days for current month
 */
function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days: Date[] = [];
  
  // Add empty days for weekday offset
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // Add all days including previous/next month padding
  for (let d = new Date(startDate); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  
  // Pad to complete grid (42 cells = 6 rows × 7 days)
  while (days.length < 42) {
    const lastDate = new Date(days[days.length - 1]);
    lastDate.setDate(lastDate.getDate() + 1);
    days.push(new Date(lastDate));
  }
  
  return days;
}

/**
 * Format date as YYYY-MM-DD for comparison
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Group orders by date and count them
 */
function groupOrdersByDate(orders: Order[]): Map<string, number> {
  const ordersByDate = new Map<string, number>();
  
  orders.forEach(order => {
    // Get date from order timestamp (in milliseconds)
    const orderDate = new Date(order.timestamp);
    const dateString = formatDateString(orderDate);
    
    ordersByDate.set(dateString, (ordersByDate.get(dateString) || 0) + 1);
  });
  
  return ordersByDate;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ orders, className = '' }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Generate calendar data
  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const ordersByDate = useMemo(() => groupOrdersByDate(orders), [orders]);
  
  // Build day data with order counts
  const calendarData: DayData[] = useMemo(() => {
    return monthDays.map(date => ({
      date,
      dateString: formatDateString(date),
      orderCount: ordersByDate.get(formatDateString(date)) || 0
    }));
  }, [monthDays, ordersByDate]);
  
  // Find max orders for color scaling
  const maxOrders = useMemo(() => {
    return Math.max(...calendarData.map(d => d.orderCount), 1);
  }, [calendarData]);
  
  // Get month name
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(currentYear, currentMonth));
  
  // Weekday labels
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-cafe-200 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-bold text-cafe-800 text-lg">{monthName} {currentYear}</h3>
        <p className="text-cafe-500 text-sm mt-1">Daily Order Volume Heatmap</p>
      </div>
      
      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-cafe-600 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((dayData, idx) => {
          const isCurrentMonth = dayData.date.getMonth() === currentMonth;
          const bgColor = getColorForOrderCount(dayData.orderCount, maxOrders);
          const isToday = 
            dayData.date.getDate() === now.getDate() &&
            dayData.date.getMonth() === now.getMonth() &&
            dayData.date.getFullYear() === now.getFullYear();
          
          return (
            <div
              key={idx}
              title={`${dayData.dateString}\n${dayData.orderCount} orders`}
              className={`
                aspect-square rounded-md flex items-center justify-center
                text-xs font-medium cursor-pointer transition-all
                relative group
                ${isCurrentMonth ? 'text-cafe-800' : 'text-cafe-300'}
                ${isToday ? 'ring-2 ring-brand-orange ring-offset-1' : 'hover:ring-1 hover:ring-cafe-300'}
              `}
              style={{
                backgroundColor: bgColor,
                opacity: isCurrentMonth ? 1 : 0.5
              }}
            >
              {dayData.date.getDate()}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-cafe-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                {dayData.dateString}
                <br />
                {dayData.orderCount} {dayData.orderCount === 1 ? 'order' : 'orders'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-cafe-900" />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-cafe-100">
        <p className="text-xs font-semibold text-cafe-600 mb-3">Order Volume</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-cafe-500">Less</span>
          <div className="flex gap-1">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, idx) => (
              <div
                key={idx}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: getColorForOrderCount(Math.ceil(intensity * maxOrders), maxOrders)
                }}
              />
            ))}
          </div>
          <span className="text-xs text-cafe-500">More</span>
        </div>
      </div>
    </div>
  );
};
