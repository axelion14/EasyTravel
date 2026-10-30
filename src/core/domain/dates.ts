/**
 * Genera un arreglo de fechas civiles 'YYYY-MM-DD' entre startDate y endDate inclusives.
 * No utiliza timestamps Unix para evitar desajustes de zona horaria del dispositivo.
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  if (startDate > endDate) return [startDate];

  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}
