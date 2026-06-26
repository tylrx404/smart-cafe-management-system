/**
 * 🤖 AI Recommendation Engine
 * ================================
 * 
 * Rule-based recommendation system for CafeOS
 * This is NOT machine learning - it's a deterministic algorithm suitable for hackathons
 * and academic projects that shows AI-style personalization.
 * 
 * Algorithm:
 * 1. Analyze user's past order history
 * 2. Apply time-of-day context (Morning/Afternoon/Evening/Night preferences)
 * 3. Rank items by user preference frequency + time appropriateness
 * 4. Filter by menu categories to show variety
 * 5. Return top 4 personalized items
 */

import { MenuItem, Order, CartItem } from '../types';
import { MENU_ITEMS } from '../constants';

interface RecommendationScore {
  item: MenuItem;
  score: number;
  reason: string;
}

/**
 * Get current time period for time-based recommendations
 * Morning: 6AM-12PM | Afternoon: 12PM-5PM | Evening: 5PM-9PM | Night: 9PM-6AM
 */
function getTimePeriod(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Get category preference for current time period
 * Helps recommend contextually appropriate items
 */
function getTimeBasedPreferences(timePeriod: string): {
  preferredCategories: string[];
  typePreference?: 'veg' | 'non-veg' | 'beverage';
} {
  const timePreferences: Record<string, any> = {
    morning: {
      preferredCategories: ['Beverages', 'Cakes'],
      typePreference: 'beverage'
    },
    afternoon: {
      preferredCategories: ['Main Course', 'Beverages'],
      typePreference: undefined
    },
    evening: {
      preferredCategories: ['Cakes', 'Beverages'],
      typePreference: 'beverage'
    },
    night: {
      preferredCategories: ['Beverages', 'Main Course'],
      typePreference: 'beverage'
    }
  };
  
  return timePreferences[timePeriod] || timePreferences.afternoon;
}

/**
 * Analyze user's order history to build preference profile
 * Returns frequency count of items ordered by user
 */
function analyzeUserPreferences(userName: string, orders: Order[]): Map<string, number> {
  const userOrders = orders.filter(o => o.customerName === userName);
  const preferences = new Map<string, number>();
  
  userOrders.forEach(order => {
    order.items?.forEach((item: CartItem) => {
      preferences.set(item.name, (preferences.get(item.name) || 0) + item.quantity);
    });
  });
  
  return preferences;
}

/**
 * Main recommendation engine
 * Takes user name and all orders, returns top 4 personalized recommendations
 */
export const RecommendationEngine = {
  /**
   * Get personalized food recommendations for a user
   * 
   * @param userName - Customer's name
   * @param orders - All orders in system (to analyze history)
   * @returns Array of recommended MenuItem objects (top 4)
   * 
   * This uses:
   * - User's past order history (frequency analysis)
   * - Current time of day context (morning/afternoon/evening/night)
   * - Menu categories available
   * - Simple scoring algorithm to rank items
   */
  getRecommendedItems: (userName: string, orders: Order[]): MenuItem[] => {
    // Step 1: Get current time period
    const timePeriod = getTimePeriod();
    const timePreferences = getTimeBasedPreferences(timePeriod);
    
    // Step 2: Analyze user's past orders
    const userPreferences = analyzeUserPreferences(userName, orders);
    
    // Step 3: Calculate recommendation score for each menu item
    const scoredItems: RecommendationScore[] = MENU_ITEMS.map(item => {
      let score = 0;
      let reasons: string[] = [];
      
      // Factor 1: User has ordered this before (frequency bonus)
      const orderCount = userPreferences.get(item.name) || 0;
      if (orderCount > 0) {
        score += orderCount * 30; // Each past order adds 30 points
        reasons.push(`ordered ${orderCount}x before`);
      }
      
      // Factor 2: Item is in time-preferred category
      if (timePreferences.preferredCategories.includes(item.category)) {
        score += 40; // Strong bonus for time-appropriate items
        reasons.push(`good for ${timePeriod}`);
      }
      
      // Factor 3: Item type matches time preference
      if (timePreferences.typePreference && item.type === timePreferences.typePreference) {
        score += 20; // Bonus for matching type preference
        reasons.push(`${item.type} item`);
      }
      
      // Factor 4: Items user hasn't tried yet get discovery bonus
      if (orderCount === 0 && timePreferences.preferredCategories.includes(item.category)) {
        score += 25; // Encourage trying new items
        reasons.push('new to you');
      }
      
      // Factor 5: Diversity bonus - prefer different categories
      // (This helps avoid recommending all beverages, for example)
      const categoryBonus = Math.random() * 5; // Small randomness for variety
      score += categoryBonus;
      
      return {
        item,
        score,
        reason: reasons.join(' • ')
      };
    });
    
    // Step 4: Sort by score and return top 4 unique items
    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(s => s.item);
  }
};
