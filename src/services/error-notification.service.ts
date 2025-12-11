import { Alert, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import i18n from '../config/i18n';
import {
  ErrorType,
  ErrorSource,
  ErrorSeverity,
  ErrorSignature,
  ShowErrorOptions,
} from '../types/errors';

class ErrorNotificationService {
  private errorCache = new Map<string, number>();
  private readonly DEDUPLICATION_WINDOW = 5000; // 5 seconds

  showError(options: ShowErrorOptions): void {
    const signature = this.createSignature(options);

    if (this.isDuplicate(signature)) {
      console.log('[ErrorNotification] Duplicate error suppressed:', signature);
      return;
    }

    this.logToConsole(options);
    this.displayToUser(options);
  }

  private createSignature(options: ShowErrorOptions): ErrorSignature {
    return {
      type: options.type,
      source: options.source,
      severity: options.severity,
    };
  }

  private isDuplicate(signature: ErrorSignature): boolean {
    const key = JSON.stringify(signature);
    const lastShown = this.errorCache.get(key);
    const now = Date.now();

    if (!lastShown || now - lastShown > this.DEDUPLICATION_WINDOW) {
      this.errorCache.set(key, now);
      return false;
    }

    return true;
  }

  private logToConsole(options: ShowErrorOptions): void {
    const context = {
      type: options.type,
      source: options.source,
      severity: options.severity,
      messageKey: options.messageKey,
      timestamp: new Date().toISOString(),
      error: options.error,
      ...options.context,
    };

    console.error('[ErrorNotification]', context);

    if (options.error?.stack) {
      console.error('[ErrorNotification] Stack:', options.error.stack);
    }
  }

  private displayToUser(options: ShowErrorOptions): void {
    const message = i18n.t(options.messageKey, options.messageParams);

    if (options.severity === ErrorSeverity.Critical) {
      this.showAlert(message, options);
    } else {
      this.showToast(message, options);
    }
  }

  private showAlert(message: string, options: ShowErrorOptions): void {
    const buttons: any[] = [];

    if (options.onOpenSettings) {
      buttons.push({
        text: i18n.t('errors.actions.openSettings'),
        onPress: () => Linking.openSettings(),
      });
    }

    if (options.onRetry) {
      buttons.push({
        text: i18n.t('errors.actions.retry'),
        onPress: options.onRetry,
      });
    }

    buttons.push({
      text: i18n.t('errors.actions.ok'),
      style: 'cancel',
    });

    Alert.alert('Error', message, buttons);
  }

  private showToast(message: string, options: ShowErrorOptions): void {
    const position = options.severity === ErrorSeverity.Warning ? 'top' : 'bottom';
    const duration = options.severity === ErrorSeverity.Warning ? 4000 : 3000;

    Toast.show({
      type: options.severity === ErrorSeverity.Warning ? 'error' : 'info',
      text1: message,
      position,
      visibilityTime: duration,
      autoHide: true,
      onPress: () => {
        if (options.onRetry) {
          options.onRetry();
          Toast.hide();
        }
      },
    });
  }

  clearAllNotifications(): void {
    Toast.hide();
    this.errorCache.clear();
  }

  logDebugInfo(context: any): void {
    console.log('[ErrorNotification] Debug:', {
      ...context,
      timestamp: new Date().toISOString(),
    });
  }
}

export const errorNotificationService = new ErrorNotificationService();
export default errorNotificationService;
