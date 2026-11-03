import { describe, it, expect } from 'vitest';
import { parseBookingConfirmation } from '@/features/smart-import/domain/booking-parser';

describe('Booking Confirmation Parser Domain Logic', () => {
  it('parses a hotel confirmation email (e.g. Booking.com) accurately', () => {
    const rawConfirmation = `
Booking.com - Confirmación de reserva
Hotel Le Marais Boutique Paris
Dirección: 15 Rue des Archives, 75004 Paris
Check-in: 15/11/2026 a las 14:00
Check-out: 18/11/2026 a las 11:00
Número de confirmación: #BK-98234190
Precio total: 320.50 €
Pagado con Visa.
    `;

    const result = parseBookingConfirmation(rawConfirmation, '2026-11-15', 'EUR');

    expect(result.type).toBe('lodging');
    expect(result.category).toBe('lodging');
    expect(result.provider).toBe('Booking.com');
    expect(result.title).toContain('Hotel Le Marais Boutique Paris');
    expect(result.address).toBe('15 Rue des Archives, 75004 Paris');
    expect(result.startDate).toBe('2026-11-15');
    expect(result.endDate).toBe('2026-11-18');
    expect(result.time).toBe('14:00');
    expect(result.bookingReference).toBe('BK-98234190');
    expect(result.price).toEqual({
      amountCents: 32050,
      currency: 'EUR',
    });
  });

  it('parses an airline flight confirmation correctly', () => {
    const rawFlightText = `
Iberia - Tu tarjeta de embarque y confirmación
Vuelo Madrid (MAD) a París (CDG) - IB3402
Fecha de salida: 2026-12-05
Hora de salida: 09:30 AM
Localizador: PNR-X987K
Total pagado: $ 185.00 USD
    `;

    const result = parseBookingConfirmation(rawFlightText, '2026-12-05', 'USD');

    expect(result.type).toBe('flight');
    expect(result.category).toBe('transit');
    expect(result.provider).toBe('Iberia');
    expect(result.startDate).toBe('2026-12-05');
    expect(result.time).toBe('09:30');
    expect(result.bookingReference).toBe('PNR-X987K');
    expect(result.price).toEqual({
      amountCents: 18500,
      currency: 'USD',
    });
  });

  it('parses a restaurant/activity confirmation with written date', () => {
    const rawActivityText = `
Confirmación de mesa en Le Jules Verne
Fecha: 16 de noviembre de 2026
Hora: 20:30
Dirección: Torre Eiffel, 2ème étage, Paris
Código de reserva: JV-5521
Depósito: 100 EUR
    `;

    const result = parseBookingConfirmation(rawActivityText, '2026-11-16', 'EUR');

    expect(result.type).toBe('activity');
    expect(result.category).toBe('food');
    expect(result.startDate).toBe('2026-11-16');
    expect(result.time).toBe('20:30');
    expect(result.bookingReference).toBe('JV-5521');
    expect(result.price).toEqual({
      amountCents: 10000,
      currency: 'EUR',
    });
  });

  it('uses fallback date and handles sparse text gracefully', () => {
    const sparseText = `Alquiler de coche en el aeropuerto`;
    const result = parseBookingConfirmation(sparseText, '2026-11-17', 'EUR');

    expect(result.startDate).toBe('2026-11-17');
    expect(result.price).toBeUndefined();
    expect(result.bookingReference).toBeUndefined();
    expect(result.title).toBe('Alquiler de coche en el aeropuerto');
  });
});
