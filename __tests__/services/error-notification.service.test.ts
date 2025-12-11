import { Alert, Linking } from 'react-native';

// Unmock the error notification service for this test file
jest.unmock('../../src/services/error-notification.service');

import errorNotificationService from '../../src/services/error-notification.service';
import { ErrorType, ErrorSource, ErrorSeverity } from '../../src/types/errors';

// Mock Toast before importing the service
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Import Toast after mocking
import Toast from 'react-native-toast-message';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openSettings: jest.fn(),
  },
}));

describe('ErrorNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorNotificationService.clearAllNotifications();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('showError', () => {
    it('should show critical error as Alert', () => {
      errorNotificationService.showError({
        type: ErrorType.Permission,
        source: ErrorSource.LocationService,
        severity: ErrorSeverity.Critical,
        messageKey: 'errors.location.permissionDenied',
      });

      expect(Alert.alert).toHaveBeenCalled();
      expect(Toast.show).not.toHaveBeenCalled();
    });

    it('should show warning as Toast at top position', () => {
      errorNotificationService.showError({
        type: ErrorType.Network,
        source: ErrorSource.AttractionsService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.network.timeout',
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          position: 'top',
          visibilityTime: 4000,
        })
      );
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should show info as Toast at bottom position', () => {
      errorNotificationService.showError({
        type: ErrorType.API,
        source: ErrorSource.OpenAIService,
        severity: ErrorSeverity.Info,
        messageKey: 'errors.api.openaiUnavailable',
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          position: 'bottom',
          visibilityTime: 3000,
        })
      );
    });

    it('should deduplicate errors within 5 seconds', () => {
      const options = {
        type: ErrorType.Network,
        source: ErrorSource.AttractionsService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.network.timeout',
      };

      errorNotificationService.showError(options);
      errorNotificationService.showError(options);

      expect(Toast.show).toHaveBeenCalledTimes(1);
    });

    it('should log error details to console', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new Error('Test error');

      errorNotificationService.showError({
        type: ErrorType.Storage,
        source: ErrorSource.StorageService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.storage.saveFailed',
        error,
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log stack trace when error has stack', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      errorNotificationService.showError({
        type: ErrorType.Network,
        source: ErrorSource.AttractionsService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.network.timeout',
        error,
      });

      expect(consoleSpy).toHaveBeenCalledWith('[ErrorNotification] Stack:', 'Stack trace here');
    });

    it('should include "Open Settings" button when onOpenSettings is true', () => {
      errorNotificationService.showError({
        type: ErrorType.Permission,
        source: ErrorSource.LocationService,
        severity: ErrorSeverity.Critical,
        messageKey: 'errors.location.permissionDenied',
        onOpenSettings: true,
      });

      expect(Alert.alert).toHaveBeenCalled();
      const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      expect(alertButtons.length).toBeGreaterThan(1);
      expect(alertButtons.some((btn: any) => btn.text === 'errors.actions.openSettings' || btn.onPress)).toBeTruthy();
    });

    it('should include "Retry" button when onRetry callback is provided', () => {
      const retryCallback = jest.fn();

      errorNotificationService.showError({
        type: ErrorType.Network,
        source: ErrorSource.AttractionsService,
        severity: ErrorSeverity.Critical,
        messageKey: 'errors.network.timeout',
        onRetry: retryCallback,
      });

      expect(Alert.alert).toHaveBeenCalled();
      const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      expect(alertButtons.length).toBeGreaterThan(1);
    });

    it('should handle message parameters for interpolation', () => {
      errorNotificationService.showError({
        type: ErrorType.Storage,
        source: ErrorSource.StorageService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.storage.saveFailed',
        messageParams: { itemType: 'favorite' },
      });

      expect(Toast.show).toHaveBeenCalled();
    });
  });

  describe('clearAllNotifications', () => {
    it('should clear toast notifications', () => {
      errorNotificationService.clearAllNotifications();

      expect(Toast.hide).toHaveBeenCalled();
    });

    it('should clear error cache', () => {
      const options = {
        type: ErrorType.Network,
        source: ErrorSource.AttractionsService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.network.timeout',
      };

      errorNotificationService.showError(options);
      errorNotificationService.showError(options);
      expect(Toast.show).toHaveBeenCalledTimes(1);

      errorNotificationService.clearAllNotifications();

      errorNotificationService.showError(options);
      expect(Toast.show).toHaveBeenCalledTimes(2);
    });
  });

  describe('logDebugInfo', () => {
    it('should log debug information to console', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const context = {
        errorType: 'UserCancellation',
        message: 'User cancelled operation',
        serviceName: 'TestService',
        methodName: 'testMethod',
      };

      errorNotificationService.logDebugInfo(context);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorNotification] Debug:',
        expect.objectContaining(context)
      );
    });
  });
});
