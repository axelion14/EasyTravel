/**
 * Puerto de abstracción para funcionalidades nativas del dispositivo.
 * Permite que el código del dominio sea agnóstico de la plataforma (web vs iOS/Android).
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export interface NotificationRequest {
  id: number;
  title: string;
  body: string;
  /** Fecha y hora exacta a la que se disparará la notificación (ISO 8601) */
  scheduleAt: string;
  extra?: Record<string, unknown>;
}

export interface NativePort {
  /** Vibración háptica con estilo semántico */
  haptic(style: HapticStyle): Promise<void>;

  /** Solicitar permiso de notificaciones y retornar si fue concedido */
  requestNotificationPermission(): Promise<boolean>;

  /** Programar una notificación local para una fecha futura */
  scheduleNotification(req: NotificationRequest): Promise<void>;

  /** Cancelar una notificación programada por su ID */
  cancelNotification(id: number): Promise<void>;

  /** Cancelar todas las notificaciones programadas de la app */
  cancelAllNotifications(): Promise<void>;
}
