export interface Ingredient {
  name: string;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageColor: string; // Hex color for placeholder
  ingredients: string[];
  youtubeId?: string;
  videoStart?: number; // Start time in seconds
  videoEnd?: number;   // End time in seconds
  available: boolean;
}

export enum OrderSize {
  SevenShots = '7-Pack (2oz shots)',
}

export const ProductPrices: Record<OrderSize, number> = {
  [OrderSize.SevenShots]: 35,
};

export interface CartItem {
  productId: string;
  productName: string;
  size: OrderSize;
  quantity: number;
  selectedOptionalIngredients?: string[];
}

export enum GroupName {
  GroupA = 'Group A (Pathfinders)',
  GroupB = 'Group B (Adventurers)',
  GroupC = 'Group C (Youth)',
  GroupD = 'Group D (Young Adults)',
}

export type DeliveryOption = 'Pickup' | 'Delivery';

export interface Order {
  id: string;
  customerName: string;
  customerContact: string;
  customerEmail?: string;
  items: CartItem[];
  assignedGroup: GroupName;
  sponsoredYouthId?: string;
  sponsoredYouthName?: string;
  orderDate: string; // ISO string
  isFulfilled: boolean;
  totalPrice: number;
  donationAmount: number;
  deliveryOption: DeliveryOption;
  deliveryAddress?: string;
  deliveryWindow?: string;
  orderNumber: string;
  zelleConfirmationNumber: string;
  isRecurring: boolean;
  recurringWeeksFulfilled?: number;
  recurringDates?: string[];
}

export interface ScheduleEvent {
    date: string; // ISO string
    group: GroupName;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: GroupName;
}

export interface VolunteerAvailability {
  id: string;
  volunteerId: string;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) if recurring
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "12:00"
  isRecurring: boolean;
  specificDate?: string; // ISO string if not recurring
}
