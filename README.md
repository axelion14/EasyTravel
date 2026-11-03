# 🌍 Travel Planner

Aplicación web y móvil para planear viajes con enfoque **Local-First**: tus datos viven en tu dispositivo y no se requieren cuentas ni API keys para empezar.

Construida con **React, Vite, MapLibre GL, Tailwind CSS y Capacitor**.

> **Estado:** MVP en desarrollo.

---

## 📋 Tabla de contenido

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Requisitos](#-requisitos)
- [Inicio rápido](#-inicio-rápido)
- [Scripts disponibles](#-scripts-disponibles)
- [Desarrollo móvil con Capacitor](#-desarrollo-móvil-con-capacitor)
- [Solución de problemas](#-solución-de-problemas)

---

## ✨ Características

- **Itinerario interactivo:** paradas organizadas con drag & drop, optimizado para pantallas táctiles.
- **Mapas sin API keys:** renderizado con MapLibre GL y tiles de OpenFreeMap.
- **Cálculo de rutas:** integración con OSRM mediante un adaptador desacoplado (arquitectura de puertos y adaptadores).
- **Presupuesto:** control de gastos del viaje con value objects de dominio (`Money`, `Coordinates`).
- **Reservas:** deep links parametrizados a Google Flights y Booking.
- **Multiplataforma:** una sola base de código para web, Android e iOS.

---

## 🧰 Stack tecnológico

| Área | Tecnología |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Mapas | MapLibre GL, OpenFreeMap |
| Rutas | OSRM (Open Source Routing Machine) |
| Drag & drop | `@dnd-kit` |
| Móvil | Capacitor (Android / iOS) |

---

## 📁 Estructura del proyecto

```
travel-app/
├── src/
│   ├── core/
│   │   └── domain/          # Value Objects: Money, Coordinates, UUID
│   ├── features/
│   │   ├── trips/           # Entidades y componentes de viajes
│   │   ├── itinerary/       # Paradas y lista drag & drop
│   │   ├── map/             # MapView (MapLibre) y adaptador de rutas OSRM
│   │   └── budget/          # Presupuesto y deep links
│   ├── shared/              # Utilidades comunes
│   └── App.tsx              # Punto de entrada de la aplicación
├── capacitor.config.ts      # Configuración nativa (Android / iOS)
└── package.json
```

---

## 📌 Requisitos

| Herramienta | Versión | Uso |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 18 o superior (se recomienda LTS) | Obligatorio |
| npm | Incluido con Node.js | Obligatorio |
| [Android Studio](https://developer.android.com/studio) | Última estable | Solo para Android |
| [Xcode](https://developer.apple.com/xcode/) | Última estable | Solo para iOS (requiere macOS) |

Verifica tu instalación:

```bash
node --version
npm --version
```

<details>
<summary>¿Cómo instalar Node.js?</summary>

- **Todas las plataformas:** descarga el instalador LTS desde [nodejs.org](https://nodejs.org/).
- **macOS (Homebrew):** `brew install node`
- **Windows (winget):** `winget install OpenJS.NodeJS.LTS`
- **Linux:** usa el gestor de paquetes de tu distribución o [nvm](https://github.com/nvm-sh/nvm).

Después de instalar, reinicia la terminal para que se actualice el `PATH`.

</details>

---

## 🚀 Inicio rápido

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd travel-app

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Abre la URL que aparece en la terminal (por defecto `http://localhost:5173`).

---

## 📜 Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera el build de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción |

---

## 📱 Desarrollo móvil con Capacitor

Antes de empezar, genera el build web, ya que Capacitor empaqueta el contenido de `dist/`:

```bash
npm run build
```

### Android

Requiere Android Studio.

```bash
npx cap add android     # Solo la primera vez
npx cap sync android    # Sincroniza el build y los plugins
npx cap open android    # Abre el proyecto en Android Studio
```

### iOS

Requiere macOS con Xcode.

```bash
npx cap add ios         # Solo la primera vez
npx cap sync ios
npx cap open ios
```

> 💡 Cada vez que modifiques el código web, ejecuta `npm run build` y `npx cap sync` para reflejar los cambios en la app nativa.

---

## 🩺 Solución de problemas

- **`node` o `npm` no se reconocen:** reinicia la terminal o revisa que Node.js esté en el `PATH`.
- **Puerto 5173 ocupado:** Vite elegirá automáticamente otro puerto; revisa la salida de la terminal.
- **Errores tras cambiar de versión de Node:** elimina `node_modules` y `package-lock.json`, y vuelve a ejecutar `npm install`.
- **Cambios web que no aparecen en el móvil:** ejecuta `npm run build` seguido de `npx cap sync`.
