export type UUID = string;

export interface Money {
  amountCents: number; // Siempre enteros para evitar redondeos raros
  currency: string;    // 'EUR', 'USD', 'MXN', etc.
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
