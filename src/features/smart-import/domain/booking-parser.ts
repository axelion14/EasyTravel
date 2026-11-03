import { Money, UUID } from '@/core/domain/types';
import { StopCategory } from '@/features/itinerary/domain/stop';
import { generateUUID } from '@/shared/lib/utils';

export interface ParsedBooking {
  id: UUID;
  type: 'lodging' | 'flight' | 'activity' | 'general';
  category: StopCategory;
  title: string;
  address?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD (para hoteles o estancias de varios días)
  time?: string;     // HH:mm
  bookingReference?: string;
  price?: Money;
  notes?: string;
  provider?: string; // ej. Booking.com, Airbnb, Iberia, etc.
}

/**
 * Normaliza fechas encontradas en texto a formato ISO civil 'YYYY-MM-DD'.
 */
function normalizeDate(dateStr: string, defaultYear = 2026): string | null {
  // 1. Formato ISO: YYYY-MM-DD
  const isoMatch = dateStr.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // 2. Formato común: DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = dateStr.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }

  // 3. Formato textual: "15 nov 2026", "15 de noviembre de 2026", "Nov 15, 2026"
  const monthMap: Record<string, string> = {
    ene: '01', jan: '01', enero: '01', january: '01',
    feb: '02', febrero: '02', february: '02',
    mar: '03', marzo: '03', march: '03',
    abr: '04', apr: '04', abril: '04', april: '04',
    may: '05', mayo: '05',
    jun: '06', junio: '06', june: '06',
    jul: '07', julio: '07', july: '07',
    ago: '08', aug: '08', agosto: '08', august: '08',
    sep: '09', sept: '09', septiembre: '09', september: '09',
    oct: '10', octubre: '10', october: '10',
    nov: '11', noviembre: '11', november: '11',
    dic: '12', dec: '12', diciembre: '12', december: '12',
  };

  const textMatch = dateStr.match(
    /\b(0[1-9]|[12]\d|3[01])\s*(?:de\s+)?([a-záéíóú]{3,10})(?:\s*(?:de|,)?\s*(20\d{2}))?\b/i
  );
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const monthKey = textMatch[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3);
    const year = textMatch[3] || String(defaultYear);
    const month = monthMap[monthKey];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Extrae montos monetarios del texto de confirmación.
 */
function extractPrice(text: string, defaultCurrency = 'EUR'): Money | undefined {
  const priceRegex = /(?:([€$£¥]|EUR|USD|GBP|MXN|JPY)\s*([\d.,]+))|(?:([\d.,]+)\s*([€$£¥]|EUR|USD|GBP|MXN|JPY))/i;
  const match = text.match(priceRegex);

  if (!match) return undefined;

  const currencySymbol = match[1] || match[4] || defaultCurrency;
  let rawAmount = match[2] || match[3];

  if (!rawAmount) return undefined;

  // Limpiar separadores de miles
  if (rawAmount.includes('.') && rawAmount.includes(',')) {
    if (rawAmount.indexOf('.') < rawAmount.indexOf(',')) {
      rawAmount = rawAmount.replace(/\./g, '').replace(',', '.');
    } else {
      rawAmount = rawAmount.replace(/,/g, '');
    }
  } else if (rawAmount.includes(',')) {
    rawAmount = rawAmount.replace(',', '.');
  }

  const parsed = parseFloat(rawAmount);
  if (isNaN(parsed) || parsed <= 0) return undefined;

  let currency = defaultCurrency;
  const s = currencySymbol.toUpperCase().trim();
  if (s === '€' || s === 'EUR') currency = 'EUR';
  else if (s === '$' || s === 'USD') currency = 'USD';
  else if (s === '£' || s === 'GBP') currency = 'GBP';
  else if (s === 'MXN') currency = 'MXN';
  else if (s === '¥' || s === 'JPY') currency = 'JPY';

  return {
    amountCents: Math.round(parsed * 100),
    currency,
  };
}

/**
 * Extrae código o referencia de confirmación/reserva línea por línea.
 */
function extractBookingRef(text: string): string | undefined {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Prioridad a localizador, PNR, código de reserva o número de confirmación
    const match = trimmed.match(
      /(?:n[uú]mero\s*(?:de\s*)?confirmaci[oó]n|c[oó]digo\s*(?:de\s*)?reserva|localizador|pnr|booking\s*(?:id|number|ref|code)|reserva\s*(?:id|#)?|pin)[\s:#]+([A-Z0-9#-]{4,25})\b/i
    );
    if (match) {
      return match[1].replace(/^#/, '').trim();
    }
  }
  return undefined;
}

/**
 * Extrae hora de llegada o salida (HH:mm).
 */
function extractTime(text: string): string | undefined {
  const timeRegex = /\b([01]?\d|2[0-3]):([0-5]\d)(?:\s*(am|pm))?\b/i;
  const match = text.match(timeRegex);
  if (!match) return undefined;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3]?.toLowerCase();

  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Motor heurístico de análisis inteligente de confirmaciones de reserva.
 */
export function parseBookingConfirmation(
  rawText: string,
  fallbackDate: string,
  baseCurrency = 'EUR'
): ParsedBooking {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Detectar tipo de reserva
  let type: ParsedBooking['type'] = 'general';
  let category: StopCategory = 'attraction';
  let provider: string | undefined = undefined;

  if (
    lower.includes('hotel') ||
    lower.includes('hostel') ||
    lower.includes('hospedaje') ||
    lower.includes('alojamiento') ||
    lower.includes('check-in') ||
    lower.includes('check in') ||
    lower.includes('airbnb') ||
    lower.includes('booking.com')
  ) {
    type = 'lodging';
    category = 'lodging';
    if (lower.includes('booking.com') || lower.includes('booking')) provider = 'Booking.com';
    else if (lower.includes('airbnb')) provider = 'Airbnb';
  } else if (
    lower.includes('vuelo') ||
    lower.includes('flight') ||
    lower.includes('aerolínea') ||
    lower.includes('airline') ||
    lower.includes('embarque') ||
    lower.includes('boarding') ||
    lower.includes('aeropuerto') ||
    lower.includes('airport') ||
    lower.includes('pnr')
  ) {
    type = 'flight';
    category = 'transit';
    if (lower.includes('ryanair')) provider = 'Ryanair';
    else if (lower.includes('iberia')) provider = 'Iberia';
    else if (lower.includes('air france')) provider = 'Air France';
    else if (lower.includes('vueling')) provider = 'Vueling';
  } else if (
    lower.includes('restaurante') ||
    lower.includes('restaurant') ||
    lower.includes('mesa') ||
    lower.includes('cena') ||
    lower.includes('dinner') ||
    lower.includes('almuerzo') ||
    lower.includes('lunch')
  ) {
    type = 'activity';
    category = 'food';
  } else if (
    lower.includes('museo') ||
    lower.includes('museum') ||
    lower.includes('tour') ||
    lower.includes('entrada') ||
    lower.includes('ticket') ||
    lower.includes('visita')
  ) {
    type = 'activity';
    category = 'attraction';
  }

  // 2. Extraer fechas
  const datesFound: string[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const d = normalizeDate(line);
    if (d && !datesFound.includes(d)) {
      datesFound.push(d);
    }
  }

  const startDate = datesFound[0] || fallbackDate;
  const endDate = datesFound.length > 1 ? datesFound[1] : undefined;

  // 3. Extraer precio
  const price = extractPrice(text, baseCurrency);

  // 4. Extraer referencia de reserva
  const bookingReference = extractBookingRef(text);

  // 5. Extraer hora
  const time = extractTime(text);

  // 6. Extraer título inteligente (evita encabezados genéricos)
  let title = '';
  for (const line of lines) {
    const clean = line.trim();
    const l = clean.toLowerCase();

    // Descartar encabezados comunes de email y confirmaciones
    if (
      l.startsWith('de:') ||
      l.startsWith('para:') ||
      l.startsWith('asunto:') ||
      l.startsWith('asunto ') ||
      l.includes('confirmación de reserva') ||
      l.includes('confirmacion de reserva') ||
      l.includes('tarjeta de embarque') ||
      l.includes('booking confirmation') ||
      l === 'booking.com' ||
      l === 'airbnb' ||
      clean.length < 3
    ) {
      continue;
    }

    // Si dice "Confirmación de mesa en Le Jules Verne", extraer "Le Jules Verne"
    const mesaMatch = clean.match(/confirmaci[oó]n\s+(?:de\s+mesa\s+)?en\s+(.+)$/i);
    if (mesaMatch) {
      title = mesaMatch[1].trim();
      break;
    }

    title = clean;
    break;
  }

  if (!title) {
    if (type === 'lodging') title = 'Reserva de Hospedaje';
    else if (type === 'flight') title = 'Reserva de Vuelo';
    else if (category === 'food') title = 'Reserva en Restaurante';
    else title = 'Reserva de Actividad';
  }

  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  // 7. Extraer dirección
  let address: string | undefined = undefined;
  const addressMatch = text.match(/(?:direcci[oó]n|address|ubicaci[oó]n)[\s:]+([^\n\r]{6,80})/i);
  if (addressMatch) {
    address = addressMatch[1].trim();
  }

  return {
    id: generateUUID(),
    type,
    category,
    title,
    address,
    startDate,
    endDate,
    time,
    bookingReference,
    price,
    provider,
    notes: `Importado automáticamente${provider ? ` (${provider})` : ''}`,
  };
}
