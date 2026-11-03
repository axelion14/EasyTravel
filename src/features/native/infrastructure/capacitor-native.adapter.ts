/**
 * Adaptador nativo para Capacitor (iOS / Android).
 * Usa @capacitor/haptics y @capacitor/local-notifications de forma dinámica.
 * Si la API no está disponible (ej. navegador de escritorio), degrada silenciosamente.
 */
import { HapticStyle, NativePort, NotificationRequest } from '../ports/native.port';

export class CapacitorNativeAdapter implements NativePort {
  /**
   * Dispara retroalimentación háptica.
   * En web silencia el error (navigator.vibrate como fallback suave).
   */
  async haptic(style: HapticStyle): Promise<void> {
    try {
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');

      switch (style) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } catch {
      // Fallback: vibración corta del navegador (si disponible)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        const pattern: Record<HapticStyle, number | number[]> = {
          light: 20,
          medium: 40,
          heavy: 80,
          success: [30, 40, 30],
          warning: [60, 30, 60],
          error: [80, 50, 80],
        };
        navigator.vibrate(pattern[style]);
      }
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch {
      // En navegadores con la Notification API
      if (typeof Notification !== 'undefined') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
      return false;
    }
  }

  async scheduleNotification(req: NotificationRequest): Promise<void> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: req.id,
            title: req.title,
            body: req.body,
            schedule: { at: new Date(req.scheduleAt) },
            extra: req.extra,
          },
        ],
      });
    } catch {
      // En web, usar setTimeout + Notification API
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const delay = new Date(req.scheduleAt).getTime() - Date.now();
        if (delay > 0) {
          setTimeout(() => {
            new Notification(req.title, { body: req.body });
          }, delay);
        }
      }
    }
  }

  async cancelNotification(id: number): Promise<void> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch {
      // Sin soporte nativo — no se puede cancelar timers web creados por setTimeout
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch {
      // Degradar silenciosamente
    }
  }
}

/** Instancia singleton compartida por toda la app */
export const nativeService = new CapacitorNativeAdapter();
