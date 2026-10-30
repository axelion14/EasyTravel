import { Coordinates } from '@/core/domain/types';
import { Stop } from '@/features/itinerary/domain/stop';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calcula la distancia ortodrómica real en metros entre dos coordenadas geográficas
 * mediante la fórmula del semiverseno (Haversine).
 */
export function haversineDistance(c1: Coordinates, c2: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(c2.lat - c1.lat);
  const dLng = toRad(c2.lng - c1.lng);

  const lat1 = toRad(c1.lat);
  const lat2 = toRad(c2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calcula la distancia total en metros a lo largo de una secuencia de paradas.
 */
export function calculateTotalPathDistance(stops: Stop[]): number {
  if (stops.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineDistance(stops[i].location, stops[i + 1].location);
  }
  return total;
}

/**
 * Invierte el segmento entre los índices i y k (2-opt swap).
 */
function twoOptSwap(route: Stop[], i: number, k: number): Stop[] {
  const newRoute: Stop[] = [];
  // 1. Agregar desde 0 hasta i - 1
  for (let c = 0; c < i; c++) {
    newRoute.push(route[c]);
  }
  // 2. Agregar desde k hasta i en orden invertido
  for (let c = k; c >= i; c--) {
    newRoute.push(route[c]);
  }
  // 3. Agregar desde k + 1 hasta el final
  for (let c = k + 1; c < route.length; c++) {
    newRoute.push(route[c]);
  }
  return newRoute;
}

export interface OptimizationResult {
  optimizedStops: Stop[];
  originalDistanceMeters: number;
  optimizedDistanceMeters: number;
  savedMeters: number;
  savedPercentage: number;
}

/**
 * Optimiza la ruta diaria de paradas utilizando una combinación de:
 * 1. Inicialización por Vecino Más Cercano (Nearest Neighbor).
 * 2. Algoritmo 2-Opt para desanudar cruces de caminos.
 *
 * @param stops Arreglo de paradas del día.
 * @param keepFirstFixed Si es true (por defecto), la primera parada (hotel o inicio) se mantiene como punto de partida fijo.
 */
export function optimizeRoute2Opt(
  stops: Stop[],
  keepFirstFixed = true
): OptimizationResult {
  if (stops.length <= 2) {
    const dist = calculateTotalPathDistance(stops);
    return {
      optimizedStops: stops,
      originalDistanceMeters: dist,
      optimizedDistanceMeters: dist,
      savedMeters: 0,
      savedPercentage: 0,
    };
  }

  const originalDistance = calculateTotalPathDistance(stops);

  // 1. Fase de aproximación: Vecino Más Cercano (Nearest Neighbor)
  const unvisited = [...stops];
  const initialRoute: Stop[] = [];

  // Punto de inicio
  const startIndex = 0;
  initialRoute.push(unvisited.splice(startIndex, 1)[0]);

  while (unvisited.length > 0) {
    const last = initialRoute[initialRoute.length - 1];
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistance(last.location, unvisited[i].location);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }

    initialRoute.push(unvisited.splice(closestIndex, 1)[0]);
  }

  // 2. Fase de refinamiento: 2-Opt heuristic
  let currentRoute = [...initialRoute];
  let bestDistance = calculateTotalPathDistance(currentRoute);
  let improved = true;
  let iterations = 0;
  const maxIterations = 50; // Garantizar parada rápida en navegador

  // Si keepFirstFixed es true, los swaps empiezan desde el índice 1
  const swapStartIndex = keepFirstFixed ? 1 : 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = swapStartIndex; i < currentRoute.length - 1; i++) {
      for (let k = i + 1; k < currentRoute.length; k++) {
        const candidateRoute = twoOptSwap(currentRoute, i, k);
        const candidateDist = calculateTotalPathDistance(candidateRoute);

        // Umbral de mejora mínima de 5 metros para evitar ciclos infinitos
        if (candidateDist < bestDistance - 5) {
          currentRoute = candidateRoute;
          bestDistance = candidateDist;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  // Re-indexar el campo order de las paradas optimizadas
  const now = new Date().toISOString();
  const optimizedStops = currentRoute.map((stop, idx) => ({
    ...stop,
    order: idx,
    updatedAt: now,
  }));

  const savedMeters = Math.max(0, originalDistance - bestDistance);
  const savedPercentage =
    originalDistance > 0 ? Math.round((savedMeters / originalDistance) * 100) : 0;

  return {
    optimizedStops,
    originalDistanceMeters: originalDistance,
    optimizedDistanceMeters: bestDistance,
    savedMeters,
    savedPercentage,
  };
}
