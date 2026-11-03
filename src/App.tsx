import { useState, useEffect, useMemo } from 'react';
import { useTripStore } from '@/features/trips/store/tripStore';
import { calculateBudgetSummary } from '@/features/budget/domain/budget';
import { CachedRoutingAdapter } from '@/features/map/infrastructure/cached-routing.adapter';
import { RouteSegment } from '@/features/map/ports/routing.port';
import { MapView } from '@/features/map/components/MapView';
import { ItineraryList } from '@/features/itinerary/components/ItineraryList';
import { BudgetSummary } from '@/features/budget/components/BudgetSummary';
import { TripHeader } from '@/features/trips/components/TripHeader';
import { ExpensesTab } from '@/features/budget/components/ExpensesTab';
import { AddStopModal } from '@/features/itinerary/components/AddStopModal';
import { TripSwitcherModal } from '@/features/trips/components/TripSwitcherModal';
import { CreateTripModal } from '@/features/trips/components/CreateTripModal';
import { SmartImportModal } from '@/features/smart-import/components/SmartImportModal';
import { ExportTripModal } from '@/features/itinerary/components/ExportTripModal';
import { ShareTripModal } from '@/features/trips/components/ShareTripModal';
import { AccountModal } from '@/features/sync/components/AccountModal';
import { NotificationsModal } from '@/features/native/components/NotificationsModal';
import { useSyncStore } from '@/features/sync/store/syncStore';
import { Calendar, Map as MapIcon, Receipt, Navigation, Clock, RotateCcw, Sparkles, WifiOff, Bell } from 'lucide-react';

const routingService = new CachedRoutingAdapter();

type TabType = 'itinerary' | 'map' | 'expenses';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('itinerary');
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [isTripSwitcherOpen, setIsTripSwitcherOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareTripOpen, setIsShareTripOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronización en la Nube y Estado de Cuenta
  const { user, syncStatus, initAuth } = useSyncStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Store persistente (Multi-Trip Local-First)
  const {
    trips,
    activeTripId,
    selectedDay,
    activeStopId,
    stops,
    expenses,
    getActiveTrip,
    getAvailableDays,
    createTrip,
    updateTrip,
    importTripBundle,
    setActiveTrip,
    deleteTrip,
    setSelectedDay,
    setActiveStopId,
    addStop,
    setDayStops,
    reorderCurrentDayStops,
    deleteStop,
    toggleStopChecklist,
    addStopChecklistItem,
    addExpense,
    deleteExpense,
    resetToDemo,
  } = useTripStore();

  const trip = getActiveTrip();
  const availableDays = getAvailableDays();

  // Escuchar parámetros de enlace compartido (?tripId=...&role=viewer)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedTripId = params.get('tripId');
      const sharedRole = params.get('role') as 'editor' | 'viewer' | null;

      if (sharedTripId) {
        const targetTrip = trips.find((t) => t.id === sharedTripId && !t.isDeleted);
        if (targetTrip) {
          setActiveTrip(sharedTripId);
          if (sharedRole && targetTrip.userRole !== sharedRole) {
            updateTrip(sharedTripId, { userRole: sharedRole });
          }
        }
      }
    }
  }, [trips, setActiveTrip, updateTrip]);

  // Filtrar paradas y gastos pertenecientes exclusivamente al viaje activo
  const activeTripStops = useMemo(() => {
    return stops.filter((s) => s.tripId === trip.id && !s.isDeleted);
  }, [stops, trip.id]);

  const activeTripExpenses = useMemo(() => {
    return expenses.filter((e) => e.tripId === trip.id && !e.isDeleted);
  }, [expenses, trip.id]);

  // Paradas del día actual ordenadas
  const currentDayStops = useMemo(() => {
    return activeTripStops
      .filter((s) => s.dayDate === selectedDay)
      .sort((a, b) => a.order - b.order);
  }, [activeTripStops, selectedDay]);

  // Resumen del presupuesto del viaje activo
  const budgetSummary = useMemo(() => {
    return calculateBudgetSummary(activeTripExpenses, trip.baseCurrency);
  }, [activeTripExpenses, trip.baseCurrency]);

  // Cálculo de ruta OSRM para el día actual
  const [routeSegment, setRouteSegment] = useState<RouteSegment | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function updateRoute() {
      if (currentDayStops.length < 2) {
        setRouteSegment(null);
        return;
      }

      setIsRouting(true);
      const waypoints = currentDayStops.map((s) => s.location);
      const route = await routingService.calculateRoute(waypoints);

      if (!isCancelled) {
        setRouteSegment(route);
        setIsRouting(false);
      }
    }

    updateRoute();

    return () => {
      isCancelled = true;
    };
  }, [currentDayStops]);

  // Coordenadas base del mapa para este viaje
  const baseMapCenter = trip.centerCoordinates || { lat: 48.8566, lng: 2.3522 };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative">
      {/* Banner de Modo Sin Conexión */}
      {!isOnline && (
        <div className="bg-slate-900 text-slate-200 text-xs px-3 py-1 flex items-center justify-center gap-1.5 font-medium shadow-sm z-30">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Modo sin conexión · Usando rutas y datos locales</span>
        </div>
      )}

      {/* Cabecera común fija */}
      <div className="px-4 pb-4 pt-4 header-top-safe bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Travel Planner MVP
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSmartImportOpen(true)}
              className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold transition-colors shadow-xs"
              title="Pegar correo o confirmación de reserva (Booking, vuelos, etc.)"
            >
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
              Importar
            </button>
            <button
              onClick={resetToDemo}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 font-medium"
              title="Restablecer datos demo"
            >
              <RotateCcw className="w-3 h-3" />
              Reiniciar
            </button>
          </div>
        </div>

        <TripHeader
          trip={trip}
          availableDays={availableDays}
          selectedDay={selectedDay}
          onSelectDay={(day) => {
            setSelectedDay(day);
            setActiveStopId(null);
          }}
          onOpenTripSwitcher={() => setIsTripSwitcherOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenShare={() => setIsShareTripOpen(true)}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          isUserLoggedIn={Boolean(user)}
          syncStatus={syncStatus}
        />
      </div>

      {/* Contenido principal según pestaña activa */}
      <div className="flex-1 p-4 pb-24 overflow-y-auto">
        {/* PESTAÑA 1: ITINERARIO */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
              <MapView
                key={trip.id} // Re-renderizar mapa al cambiar de viaje
                stops={currentDayStops}
                activeStopId={activeStopId}
                routeSegment={routeSegment}
                onSelectStop={setActiveStopId}
                center={baseMapCenter}
              />

              {routeSegment && (
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 shadow-md">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>{(routeSegment.distanceMeters / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>~{Math.round(routeSegment.durationSeconds / 60)} min</span>
                  </div>
                </div>
              )}
            </div>

            <ItineraryList
              stops={currentDayStops}
              activeStopId={activeStopId}
              onSelectStop={setActiveStopId}
              onReorder={reorderCurrentDayStops}
              onDeleteStop={deleteStop}
              onAddStop={() => setIsAddStopOpen(true)}
              onToggleChecklist={toggleStopChecklist}
              onAddChecklistItem={addStopChecklistItem}
              onOptimizeRoute={(optimizedStops) => setDayStops(trip.id, selectedDay, optimizedStops)}
            />

            <BudgetSummary
              summary={budgetSummary}
              destination={trip.destination}
              startDate={trip.startDate}
              endDate={trip.endDate}
            />
          </div>
        )}

        {/* PESTAÑA 2: MAPA COMPLETO */}
        {activeTab === 'map' && (
          <div className="space-y-3">
            <div className="h-[65vh] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative">
              <MapView
                key={trip.id}
                stops={currentDayStops}
                activeStopId={activeStopId}
                routeSegment={routeSegment}
                onSelectStop={setActiveStopId}
                center={baseMapCenter}
              />

              {routeSegment && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-xl text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Distancia total</p>
                      <p className="text-sm font-extrabold text-slate-900">
                        {(routeSegment.distanceMeters / 1000).toFixed(1)} km
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Tiempo en ruta</p>
                    <p className="text-sm font-extrabold text-blue-600">
                      ~{Math.round(routeSegment.durationSeconds / 60)} min
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-center text-slate-400 font-medium">
              Mostrando {currentDayStops.length} paradas en {trip.destination} ({selectedDay})
            </p>
          </div>
        )}

        {/* PESTAÑA 3: GASTOS */}
        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={activeTripExpenses}
            summary={budgetSummary}
            tripId={trip.id}
            defaultDate={selectedDay}
            currency={trip.baseCurrency}
            onAddExpense={addExpense}
            onDeleteExpense={deleteExpense}
          />
        )}
      </div>

      {/* Barra de navegación inferior móvil — respeta el home indicator de iOS */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 nav-bottom-safe flex items-center justify-around z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'itinerary'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Itinerario</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'map'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px]">Mapa</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'expenses'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">Gastos</span>
        </button>

        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-purple-600 transition-all"
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px]">Alertas</span>
        </button>
      </nav>

      {/* Modal para agregar parada */}
      <AddStopModal
        isOpen={isAddStopOpen}
        onClose={() => setIsAddStopOpen(false)}
        tripId={trip.id}
        selectedDay={selectedDay}
        currentStopsCount={currentDayStops.length}
        baseCoordinates={baseMapCenter}
        currency={trip.baseCurrency}
        onSave={addStop}
      />

      {/* Modal para cambiar entre viajes */}
      <TripSwitcherModal
        isOpen={isTripSwitcherOpen}
        onClose={() => setIsTripSwitcherOpen(false)}
        trips={trips}
        activeTripId={activeTripId}
        onSelectTrip={setActiveTrip}
        onDeleteTrip={deleteTrip}
        onOpenCreateModal={() => setIsCreateTripOpen(true)}
      />

      {/* Modal para crear nuevo viaje */}
      <CreateTripModal
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onCreateTrip={(params) => {
          createTrip(params);
        }}
      />

      {/* Modal para importar confirmaciones de reservas con IA / heurística */}
      <SmartImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        tripId={trip.id}
        defaultDate={selectedDay}
        baseCoordinates={baseMapCenter}
        baseCurrency={trip.baseCurrency}
        currentDayStopsCount={currentDayStops.length}
        onImportSuccess={({ stop, expense }) => {
          addStop(stop);
          if (expense) {
            addExpense(expense);
          }
        }}
      />

      {/* Modal para exportar a iCalendar (.ics) o imprimir en PDF */}
      <ExportTripModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        trip={trip}
        stops={activeTripStops}
        budgetSummary={budgetSummary}
      />

      {/* Modal para compartir y colaborar con acompañantes */}
      <ShareTripModal
        isOpen={isShareTripOpen}
        onClose={() => setIsShareTripOpen(false)}
        trip={trip}
        stops={activeTripStops}
        expenses={activeTripExpenses}
        onUpdateTrip={updateTrip}
        onImportBundle={importTripBundle}
      />

      {/* Modal para cuenta y sincronización en la nube */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Modal para notificaciones y recordatorios de paradas */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        stops={activeTripStops}
        tripTitle={trip.title}
      />
    </div>
  );
}
