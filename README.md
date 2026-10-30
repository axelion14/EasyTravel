# 🌍 Travel Planner App (MVP)

Aplicación móvil y web de planeación de viajes con enfoque *Local-First*, construida sobre **React, Vite, MapLibre GL, Tailwind CSS y Capacitor**.

---

## 🚀 Arquitectura y Tecnologías
* **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
* **Mapas & Tiles:** MapLibre GL + OpenFreeMap (Libre, sin API Keys requeridas)
* **Cálculo de Rutas:** Adaptador OSRM (Open Source Routing Machine) desacoplado por puertos
* **Itinerario:** `@dnd-kit` optimizado para sensores táctiles en WebView
* **Presupuesto & Reservas:** Deep linking paramétrico a Google Flights y Booking
* **Empaquetado Móvil:** Capacitor (iOS y Android)

---

## 📦 Estructura del Proyecto

```
travel-app/
├── src/
│   ├── core/domain/           # Value Objects: Money, Coordinates, UUID
│   ├── features/
│   │   ├── trips/             # Entidades y componentes de Viajes
│   │   ├── itinerary/         # Paradas, lista drag & drop
│   │   ├── map/               # MapView (MapLibre), OSRM Routing Adapter
│   │   └── budget/            # Cálculo de presupuesto y Deep Links
│   ├── shared/                # Utilidades comunes
│   └── App.tsx                # Prototipo funcional integrado
└── capacitor.config.ts        # Configuración nativa para iOS/Android
```

---

## 🛠️ Cómo Ejecutar el Proyecto (PowerShell / Windows)

### 1. Requisitos
Asegúrate de contar con **Node.js (v18+)** instalado en Windows.
Si aún no lo tienes, puedes instalarlo desde una ventana de PowerShell:
```powershell
winget install OpenJS.NodeJS.LTS
```
*(Nota: tras instalarlo, reinicia tu terminal PowerShell para que refresque el PATH).*

### 2. Instalar dependencias
```powershell
Set-Location "C:\Users\Axel\.gemini\antigravity\scratch\travel-app"
npm install
```

### 3. Modo Desarrollo Web
```powershell
npm run dev
```

### 4. Probar en Móvil con Capacitor (Android Studio)
```powershell
# Construir la aplicación web
npm run build

# Agregar plataforma Android
npx cap add android

# Sincronizar y abrir en Android Studio
npx cap sync
npx cap open android
```
