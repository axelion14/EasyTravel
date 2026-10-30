import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Cargar el web worker de MapLibre a través de Vite sin errores de dependencias optimizadas
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Coordinates } from '@/core/domain/types';
import { Stop } from '@/features/itinerary/domain/stop';
import { RouteSegment } from '../ports/routing.port';

// Asignar el worker explícitamente para evitar el warning de optimizeDeps en Vite
maplibregl.setWorkerUrl(maplibreWorkerUrl);

interface MapViewProps {
  stops: Stop[];
  activeStopId?: string | null;
  routeSegment?: RouteSegment | null;
  onSelectStop?: (stopId: string) => void;
  center?: Coordinates;
}

// Estilo probado: Carto Voyager GL (vector tiles libres, alta definición, calles y POIs claros)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export const MapView: React.FC<MapViewProps> = ({
  stops,
  activeStopId,
  routeSegment,
  onSelectStop,
  center = { lat: 48.8566, lng: 2.3522 }, // París por defecto
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // 1. Inicialización del mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [center.lng, center.lat],
      zoom: 12.5,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    map.on('load', () => {
      // Fuente para la ruta
      if (!map.getSource('route-source')) {
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        // Borde de contraste de la ruta
        map.addLayer({
          id: 'route-line-casing',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#1d4ed8',
            'line-width': 7,
            'line-opacity': 0.8,
          },
        });

        // Línea principal azul brillante
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4.5,
          },
        });
      }

      // Asegurar tamaño exacto del canvas
      map.resize();
    });

    // ResizeObserver para redimensionar el mapa si cambia el tamaño del contenedor o la pestaña
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainer.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Actualizar la ruta dibujada cuando cambia
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('route-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (routeSegment && routeSegment.geometryGeoJSON) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: routeSegment.geometryGeoJSON,
      });
    } else {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }, [routeSegment]);

  // 3. Actualizar marcadores de paradas y ajustar el encuadre (fitBounds)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Limpiar marcadores previos
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (stops.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    stops.forEach((stop, index) => {
      const isActive = stop.id === activeStopId;

      // Elemento HTML nativo del marcador
      const el = document.createElement('div');
      el.className = 'group cursor-pointer select-none';

      // Pin tipo mapa moderno con flecha inferior y badge numérico
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center font-bold text-xs rounded-full shadow-lg transition-transform ${
            isActive
              ? 'w-9 h-9 bg-blue-600 text-white ring-4 ring-blue-300 scale-125 z-20'
              : 'w-7 h-7 bg-white text-slate-800 border-2 border-blue-600 hover:scale-110 z-10'
          }">
            ${index + 1}
          </div>
          <div class="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5 shadow-sm"></div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectStop?.(stop.id);
      });

      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
        className: 'rounded-xl shadow-xl',
      }).setHTML(`
        <div class="p-1 font-sans">
          <p class="font-bold text-xs text-slate-900">${stop.title}</p>
          ${stop.address ? `<p class="text-[10px] text-slate-500 mt-0.5 line-clamp-1">${stop.address}</p>` : ''}
        </div>
      `);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([stop.location.lng, stop.location.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([stop.location.lng, stop.location.lat]);
    });

    // Encuadrar el mapa para mostrar todas las paradas en vista
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 50, right: 50 },
        maxZoom: 15,
        duration: 900,
      });
    }
  }, [stops, activeStopId]);

  return (
    <div className="relative w-full h-full min-h-[260px] overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
