# Quick Start: Implementing Error Notifications

**Feature**: 003-error-notifications  
**Date**: 2025-12-11  
**Audience**: Developers implementing this feature

## Overview

This guide provides a quick implementation path for adding user-facing error notifications to the Travel Guide App. Follow these steps in order for the fastest path to a working implementation.

## Prerequisites

- ✅ Feature spec reviewed ([spec.md](./spec.md))
- ✅ Data model understood ([data-model.md](./data-model.md))
- ✅ API contract reviewed ([contracts/error-notification-api.md](./contracts/error-notification-api.md))
- ✅ Research decisions understood ([research.md](./research.md))

## Implementation Order

Follow these steps in sequence to implement the feature with minimal rework:

### Step 1: Install Dependencies (5 minutes)

Install the toast notification library:

```bash
npm install react-native-toast-message
```

**Verify**:
- Package appears in package.json
- No peer dependency warnings
- TypeScript types included

---

### Step 2: Create Type Definitions (10 minutes)

Create `src/types/errors.ts` with all error-related types:

```typescript
// src/types/errors.ts

export enum ErrorType {
  Location = 'location',
  Network = 'network',
  Storage = 'storage',
  API = 'api',
  Permission = 'permission',
  Validation = 'validation',
  Unknown = 'unknown'
}

export enum ErrorSource {
  LocationService = 'locationService',
  AttractionsService = 'attractionsService',
  WikiService = 'wikiService',
  OpenAIService = 'openaiService',
  StorageService = 'storageService',
  FavoritesService = 'favoritesService',
  InterestsService = 'interestsService',
  UseLocation = 'useLocation',
  UseAttractions = 'useAttractions',
  UseFavorites = 'useFavorites',
  HomeScreen = 'homeScreen',
  MapScreen = 'mapScreen',
  DetailsScreen = 'detailsScreen',
  FavoritesScreen = 'favoritesScreen',
  SettingsScreen = 'settingsScreen',
  System = 'system',
  Unknown = 'unknown'
}

export enum ErrorSeverity {
  Critical = 'critical',
  Warning = 'warning',
  Info = 'info'
}

export enum RecoveryActionType {
  OpenSettings = 'openSettings',
  Retry = 'retry',
  Dismiss = 'dismiss'
}

export interface ErrorContext {
  errorType: string;
  message: string;
  stack?: string;
  serviceName: string;
  methodName: string;
  inputParams?: any;
  httpStatus?: number;
  requestUrl?: string;
}

export interface RecoveryAction {
  type: RecoveryActionType;
  labelKey: string;
  callback: () => void | Promise<void>;
  primary: boolean;
}

export interface ErrorNotification {
  id: string;
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
  messageKey: string;
  messageParams?: Record<string, any>;
  timestamp: number;
  technicalDetails: ErrorContext;
  recoveryActions: RecoveryAction[];
}

export interface ShowErrorOptions {
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
  messageKey: string;
  messageParams?: Record<string, any>;
  error?: Error;
  context?: Partial<ErrorContext>;
  onRetry?: () => void | Promise<void>;
  onOpenSettings?: boolean;
}

export interface ErrorSignature {
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
}
```

**Verify**: TypeScript compiles without errors

---

### Step 3: Add i18n Translations (15 minutes)

Update `src/config/i18n.ts` to add error message translations:

```typescript
// Add to existing translation resources

const resources = {
  en: {
    translation: {
      // ... existing translations
      errors: {
        location: {
          permissionDenied: "Location access is required to find nearby attractions. Please enable location in settings.",
          unavailable: "Unable to determine your location. Please try again.",
          timeout: "Location request timed out. Please try again."
        },
        network: {
          offline: "No internet connection. Please check your connection and try again.",
          timeout: "Request timed out. Please try again.",
          serverError: "Unable to load data. Please try again later."
        },
        storage: {
          saveFailed: "Unable to save {{itemType}}. Please try again.",
          loadFailed: "Unable to load saved data."
        },
        api: {
          openaiUnavailable: "Unable to personalize recommendations. Showing all attractions.",
          wikiUnavailable: "Additional information not available for this attraction.",
          rateLimited: "Too many requests. Please wait a moment."
        },
        actions: {
          openSettings: "Open Settings",
          retry: "Retry",
          dismiss: "Dismiss",
          ok: "OK"
        }
      }
    }
  },
  de: {
    translation: {
      // ... existing translations
      errors: {
        location: {
          permissionDenied: "Standortzugriff ist erforderlich, um Sehenswürdigkeiten in der Nähe zu finden. Bitte aktivieren Sie den Standort in den Einstellungen.",
          unavailable: "Ihr Standort kann nicht ermittelt werden. Bitte versuchen Sie es erneut.",
          timeout: "Standortanfrage ist abgelaufen. Bitte versuchen Sie es erneut."
        },
        network: {
          offline: "Keine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
          timeout: "Anfrage ist abgelaufen. Bitte versuchen Sie es erneut.",
          serverError: "Daten können nicht geladen werden. Bitte versuchen Sie es später erneut."
        },
        storage: {
          saveFailed: "{{itemType}} kann nicht gespeichert werden. Bitte versuchen Sie es erneut.",
          loadFailed: "Gespeicherte Daten können nicht geladen werden."
        },
        api: {
          openaiUnavailable: "Empfehlungen können nicht personalisiert werden. Alle Sehenswürdigkeiten werden angezeigt.",
          wikiUnavailable: "Zusätzliche Informationen für diese Sehenswürdigkeit nicht verfügbar.",
          rateLimited: "Zu viele Anfragen. Bitte warten Sie einen Moment."
        },
        actions: {
          openSettings: "Einstellungen öffnen",
          retry: "Erneut versuchen",
          dismiss: "Schließen",
          ok: "OK"
        }
      }
    }
  }
};
```

**Verify**: Translations load correctly in both languages

---

### Step 4: Implement Error Notification Service (30 minutes)

Create `src/services/error-notification.service.ts`:

```typescript
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Linking from 'expo-linking';
import i18n from '../config/i18n';
import {
  ErrorType,
  ErrorSource,
  ErrorSeverity,
  ErrorSignature,
  ShowErrorOptions,
  RecoveryActionType
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
      severity: options.severity
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
      ...options.context
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
        onPress: () => Linking.openSettings()
      });
    }

    if (options.onRetry) {
      buttons.push({
        text: i18n.t('errors.actions.retry'),
        onPress: options.onRetry
      });
    }

    buttons.push({
      text: i18n.t('errors.actions.ok'),
      style: 'cancel'
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
      }
    });
  }

  clearAllNotifications(): void {
    Toast.hide();
    this.errorCache.clear();
  }

  logDebugInfo(context: any): void {
    console.log('[ErrorNotification] Debug:', {
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}

export const errorNotificationService = new ErrorNotificationService();
export default errorNotificationService;
```

**Verify**: Service compiles and exports correctly

---

### Step 5: Add Toast Container to App (5 minutes)

Update `src/App.tsx` to include the Toast container:

```typescript
import Toast from 'react-native-toast-message';

// ... existing imports and code

export default function App() {
  return (
    <>
      {/* Existing app content */}
      <NavigationContainer>
        {/* Your navigation setup */}
      </NavigationContainer>
      
      {/* Add Toast container at the end */}
      <Toast />
    </>
  );
}
```

**Verify**: Toast container renders without errors

---

### Step 6: Integrate into One Service (15 minutes)

Start with location.service.ts as the proof of concept:

```typescript
import errorNotificationService from './error-notification.service';
import { ErrorType, ErrorSource, ErrorSeverity } from '../types/errors';

// In location.service.ts
async getCurrentPosition() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (!status.granted) {
      errorNotificationService.showError({
        type: ErrorType.Permission,
        source: ErrorSource.LocationService,
        severity: ErrorSeverity.Critical,
        messageKey: 'errors.location.permissionDenied',
        error: new Error('Permission denied'),
        onOpenSettings: true
      });
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000
    });

    return position;
  } catch (error) {
    console.error('Error getting location:', error); // Keep existing log
    
    errorNotificationService.showError({
      type: ErrorType.Location,
      source: ErrorSource.LocationService,
      severity: ErrorSeverity.Warning,
      messageKey: 'errors.location.unavailable',
      error: error as Error,
      onRetry: () => this.getCurrentPosition()
    });
    
    throw error;
  }
}
```

**Verify**: 
- Permission denial shows alert with "Open Settings" button
- Location errors show toast with retry option
- Console still logs full error details

---

### Step 7: Test End-to-End (10 minutes)

Test the implementation:

1. **Test Permission Denial**:
   - Deny location permission
   - Verify critical alert appears
   - Verify "Open Settings" button works
   - Check console for debug logs

2. **Test Network Error**:
   - Turn off wifi/data
   - Try to load attractions
   - Verify warning toast appears
   - Verify retry button works

3. **Test Deduplication**:
   - Trigger same error multiple times rapidly
   - Verify only one notification shows

4. **Test i18n**:
   - Switch language to German
   - Trigger error
   - Verify German translation appears

**Verify**: All tests pass before proceeding

---

### Step 8: Integrate Remaining Services (60 minutes)

Apply the same pattern to all other services:

**Priority Order**:
1. ✅ location.service.ts (completed in Step 6)
2. attractions.service.ts (network errors)
3. storage.service.ts (storage errors)
4. favorites.service.ts (storage errors)
5. wiki.service.ts (API errors)
6. openai.service.ts (API errors - info level)
7. interests.service.ts (storage errors)

**Template for each service**:
```typescript
try {
  // existing code
} catch (error) {
  console.error('Original log', error); // Keep for now
  
  errorNotificationService.showError({
    type: ErrorType.[appropriate type],
    source: ErrorSource.[service name],
    severity: ErrorSeverity.[appropriate level],
    messageKey: 'errors.[category].[specific error]',
    error: error as Error,
    onRetry: () => this.[methodName]()
  });
  
  throw error; // Maintain existing error propagation
}
```

**Verify**: Each service displays appropriate errors

---

### Step 9: Write Tests (45 minutes)

Create `__tests__/services/error-notification.service.test.ts`:

```typescript
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import errorNotificationService from '../../src/services/error-notification.service';
import { ErrorType, ErrorSource, ErrorSeverity } from '../../src/types/errors';

jest.mock('react-native-toast-message');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}));

describe('ErrorNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorNotificationService.clearAllNotifications();
  });

  it('should show critical error as Alert', () => {
    errorNotificationService.showError({
      type: ErrorType.Permission,
      source: ErrorSource.LocationService,
      severity: ErrorSeverity.Critical,
      messageKey: 'errors.location.permissionDenied'
    });

    expect(Alert.alert).toHaveBeenCalled();
  });

  it('should show warning as Toast', () => {
    errorNotificationService.showError({
      type: ErrorType.Network,
      source: ErrorSource.AttractionsService,
      severity: ErrorSeverity.Warning,
      messageKey: 'errors.network.timeout'
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        position: 'top'
      })
    );
  });

  it('should deduplicate errors within 5 seconds', () => {
    const options = {
      type: ErrorType.Network,
      source: ErrorSource.AttractionsService,
      severity: ErrorSeverity.Warning,
      messageKey: 'errors.network.timeout'
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
      error
    });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
```

**Verify**: All tests pass with `npm test`

---

### Step 10: Update Existing Tests (30 minutes)

Update service tests to mock error notifications:

```typescript
// In __tests__/services/location.service.test.ts
import errorNotificationService from '../../src/services/error-notification.service';

jest.mock('../../src/services/error-notification.service', () => ({
  errorNotificationService: {
    showError: jest.fn()
  },
  default: {
    showError: jest.fn()
  }
}));

describe('LocationService with error notifications', () => {
  it('should show error notification when permission denied', async () => {
    // ... test setup
    
    await locationService.getCurrentPosition();
    
    expect(errorNotificationService.showError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ErrorType.Permission,
        severity: ErrorSeverity.Critical
      })
    );
  });
});
```

**Verify**: All existing tests still pass

---

## Testing Checklist

Before marking as complete, verify:

- [ ] All tests pass: `npm test`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Critical errors show as alerts
- [ ] Warnings show as top toasts (4s)
- [ ] Info messages show as bottom toasts (3s)
- [ ] "Open Settings" works for permission errors
- [ ] "Retry" works for network/storage errors
- [ ] Errors deduplicate within 5 seconds
- [ ] German translations work correctly
- [ ] Console logs contain full debug info
- [ ] No UI jank during error display
- [ ] Existing functionality unaffected

---

## Common Issues & Solutions

### Issue: Toast not appearing
**Solution**: Verify Toast container added to App.tsx after NavigationContainer

### Issue: Translations not loading
**Solution**: Check i18n.ts includes errors object in both en and de

### Issue: TypeScript errors on error types
**Solution**: Ensure errors.ts is in src/types/ and properly exported

### Issue: Tests failing after integration
**Solution**: Mock errorNotificationService in test setup

### Issue: Duplicate notifications
**Solution**: Verify deduplication window (5 seconds) is working

---

## Performance Validation

After implementation, verify:

- [ ] Error display latency <100ms
- [ ] No dropped frames during toast display
- [ ] Memory usage stable (<5KB for error cache)
- [ ] Bundle size increase <100KB

---

## Next Steps

After completing this quick start:

1. Run full test suite: `npm test`
2. Manual testing on iOS and Android
3. Review console logs for completeness
4. Gather user feedback on error messages
5. Consider Phase 2 enhancements (if any)

---

## Support

If you encounter issues:
- Review [spec.md](./spec.md) for requirements
- Check [contracts/error-notification-api.md](./contracts/error-notification-api.md) for API details
- Review [data-model.md](./data-model.md) for type definitions
- Check [research.md](./research.md) for decision rationale
