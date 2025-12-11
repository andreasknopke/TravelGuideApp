# Error Notification Service API Contract

**Feature**: 003-error-notifications  
**Date**: 2025-12-11  
**Version**: 1.0.0

## Overview

This document defines the public API contract for the Error Notification Service. All services, hooks, and screens will use this interface to display errors to users while preserving debug information for developers.

---

## Service Interface

### ErrorNotificationService

Central service for handling all error notifications in the application.

---

## Public Methods

### `showError(options: ShowErrorOptions): void`

Display an error notification to the user with appropriate severity and recovery actions.

**Parameters**:
```typescript
interface ShowErrorOptions {
  type: ErrorType;                           // Category of error
  source: ErrorSource;                       // Where error originated
  severity: ErrorSeverity;                   // Display urgency
  messageKey: string;                        // i18n translation key
  messageParams?: Record<string, any>;       // Dynamic values for interpolation
  error?: Error;                             // Original error object (for stack trace)
  context?: Partial<ErrorContext>;           // Additional debug info
  onRetry?: () => void | Promise<void>;      // Retry callback (optional)
  onOpenSettings?: boolean;                  // Show "Open Settings" action
}
```

**Returns**: `void`

**Behavior**:
- Creates ErrorNotification entity
- Checks for duplicate (same signature within 5 seconds)
- If not duplicate: Displays to user based on severity
- Always logs full context to console
- Registers recovery actions if provided

**Examples**:
```typescript
// Critical error with settings action
errorNotificationService.showError({
  type: ErrorType.Permission,
  source: ErrorSource.LocationService,
  severity: ErrorSeverity.Critical,
  messageKey: 'errors.location.permissionDenied',
  error: permissionError,
  onOpenSettings: true
});

// Warning with retry
errorNotificationService.showError({
  type: ErrorType.Network,
  source: ErrorSource.AttractionsService,
  severity: ErrorSeverity.Warning,
  messageKey: 'errors.network.timeout',
  error: timeoutError,
  context: {
    serviceName: 'AttractionsService',
    methodName: 'fetchAttractions',
    requestUrl: 'https://api.example.com/attractions'
  },
  onRetry: async () => {
    await attractionsService.fetchAttractions();
  }
});

// Info notification (no actions)
errorNotificationService.showError({
  type: ErrorType.API,
  source: ErrorSource.OpenAIService,
  severity: ErrorSeverity.Info,
  messageKey: 'errors.api.openaiUnavailable',
  error: apiError
});

// Error with dynamic values
errorNotificationService.showError({
  type: ErrorType.Storage,
  source: ErrorSource.FavoritesService,
  severity: ErrorSeverity.Warning,
  messageKey: 'errors.storage.saveFailed',
  messageParams: { itemType: 'favorite' },
  error: storageError,
  onRetry: async () => {
    await favoritesService.saveFavorite(attraction);
  }
});
```

---

### `showNetworkError(error: Error, options?: NetworkErrorOptions): void`

Convenience method for network errors with automatic error type detection.

**Parameters**:
```typescript
interface NetworkErrorOptions {
  source: ErrorSource;                       // Where error originated
  url?: string;                              // Request URL
  method?: string;                           // HTTP method
  statusCode?: number;                       // HTTP status code
  onRetry?: () => void | Promise<void>;      // Retry callback
}
```

**Returns**: `void`

**Behavior**:
- Analyzes error to determine if offline, timeout, or server error
- Automatically sets appropriate messageKey based on error type
- Sets severity based on status code (5xx = Critical, 4xx = Warning, timeout = Warning, offline = Critical)
- Includes HTTP context in debug logs

**Examples**:
```typescript
try {
  const response = await axios.get('/api/attractions');
} catch (error) {
  errorNotificationService.showNetworkError(error, {
    source: ErrorSource.AttractionsService,
    url: '/api/attractions',
    method: 'GET',
    onRetry: () => fetchAttractions()
  });
}
```

---

### `showLocationError(error: Error, permissionStatus: PermissionStatus): void`

Convenience method for location-related errors with permission context.

**Parameters**:
```typescript
interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  expires: 'never' | number;
}
```

**Returns**: `void`

**Behavior**:
- Determines if permission denied, unavailable, or timeout
- Shows "Open Settings" action if permission permanently denied
- Shows "Retry" action if permission can be re-requested
- Sets appropriate severity (Critical if denied, Warning if timeout)

**Examples**:
```typescript
try {
  const location = await Location.getCurrentPositionAsync();
} catch (error) {
  const { status } = await Location.getPermissionsAsync();
  errorNotificationService.showLocationError(error, {
    granted: status.granted,
    canAskAgain: status.canAskAgain,
    expires: status.expires
  });
}
```

---

### `showStorageError(error: Error, operation: 'save' | 'load' | 'delete', itemType: string, onRetry?: () => void): void`

Convenience method for storage errors with operation context.

**Parameters**:
- `error`: Original error object
- `operation`: Type of storage operation that failed
- `itemType`: What was being stored (e.g., 'favorite', 'setting', 'cache')
- `onRetry`: Optional retry callback

**Returns**: `void`

**Behavior**:
- Sets messageKey based on operation type
- Includes itemType in message interpolation
- Always provides retry option if callback supplied

**Examples**:
```typescript
try {
  await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
} catch (error) {
  errorNotificationService.showStorageError(
    error,
    'save',
    'favorites',
    () => saveFavorites(favorites)
  );
}
```

---

### `logDebugInfo(context: ErrorContext): void`

Log detailed error information to console without showing user notification.

**Parameters**:
```typescript
interface ErrorContext {
  errorType: string;
  message: string;
  stack?: string;
  serviceName: string;
  methodName: string;
  inputParams?: any;
  httpStatus?: number;
  requestUrl?: string;
}
```

**Returns**: `void`

**Behavior**:
- Logs to console only (no user notification)
- Used for expected errors that shouldn't notify user (e.g., user cancellation)
- Maintains debug trail for developers

**Examples**:
```typescript
// Log expected error without notifying user
errorNotificationService.logDebugInfo({
  errorType: 'UserCancellation',
  message: 'User cancelled location request',
  serviceName: 'LocationService',
  methodName: 'getCurrentPosition'
});
```

---

### `clearAllNotifications(): void`

Dismiss all currently visible notifications.

**Parameters**: None

**Returns**: `void`

**Behavior**:
- Closes all active toasts
- Clears error cache
- Used when navigating away or on app state changes

**Examples**:
```typescript
// Clear notifications when user navigates away
useEffect(() => {
  return () => {
    errorNotificationService.clearAllNotifications();
  };
}, []);
```

---

## Type Definitions

All types used by the service API:

```typescript
// Enums
enum ErrorType {
  Location = 'location',
  Network = 'network',
  Storage = 'storage',
  API = 'api',
  Permission = 'permission',
  Validation = 'validation',
  Unknown = 'unknown'
}

enum ErrorSource {
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

enum ErrorSeverity {
  Critical = 'critical',
  Warning = 'warning',
  Info = 'info'
}

enum RecoveryActionType {
  OpenSettings = 'openSettings',
  Retry = 'retry',
  Dismiss = 'dismiss',
  Refresh = 'refresh'
}

// Interfaces
interface ShowErrorOptions {
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

interface ErrorContext {
  errorType: string;
  message: string;
  stack?: string;
  serviceName: string;
  methodName: string;
  inputParams?: any;
  httpStatus?: number;
  requestUrl?: string;
}

interface NetworkErrorOptions {
  source: ErrorSource;
  url?: string;
  method?: string;
  statusCode?: number;
  onRetry?: () => void | Promise<void>;
}

interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  expires: 'never' | number;
}
```

---

## Usage Patterns

### Pattern 1: Service Error Handling

Services should catch errors and use the error notification service:

```typescript
// In location.service.ts
async getCurrentPosition() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (!status.granted) {
      errorNotificationService.showLocationError(
        new Error('Permission denied'),
        status
      );
      return null;
    }
    
    return await Location.getCurrentPositionAsync();
  } catch (error) {
    errorNotificationService.showLocationError(error, status);
    throw error; // Re-throw for caller to handle
  }
}
```

### Pattern 2: Hook Error Handling

Hooks should catch service errors and potentially add retry logic:

```typescript
// In useLocation.ts
const [error, setError] = useState<Error | null>(null);

const loadLocation = useCallback(async () => {
  try {
    const position = await locationService.getCurrentPosition();
    setLocation(position);
  } catch (error) {
    setError(error);
    // Error already shown to user by service
  }
}, []);
```

### Pattern 3: Screen Error Handling

Screens typically don't need to show additional errors (handled by hooks/services), but can add screen-specific context:

```typescript
// In HomeScreen.tsx
useEffect(() => {
  const loadData = async () => {
    try {
      await loadAttractions();
      await loadFavorites();
    } catch (error) {
      // Errors already shown, just log screen context
      errorNotificationService.logDebugInfo({
        errorType: error.name,
        message: error.message,
        serviceName: 'HomeScreen',
        methodName: 'loadData'
      });
    }
  };
  
  loadData();
}, []);
```

---

## Integration Points

### Services Integration

All services must integrate error notifications:

**Required Changes**:
1. Import `errorNotificationService`
2. Wrap async operations in try-catch
3. Call appropriate error method (showError, showNetworkError, etc.)
4. Include retry callbacks where applicable

**Services to Update**:
- ✅ location.service.ts
- ✅ attractions.service.ts
- ✅ wiki.service.ts
- ✅ openai.service.ts
- ✅ storage.service.ts
- ✅ favorites.service.ts
- ✅ interests.service.ts

### Hooks Integration

Hooks should handle service errors gracefully:

**Required Changes**:
1. Catch service errors
2. Update local error state
3. No additional error notifications (service already showed)

**Hooks to Update**:
- ✅ useLocation.ts
- ✅ useAttractions.ts
- ✅ useFavorites.ts

### Screens Integration

Screens need to handle toast notifications:

**Required Changes**:
1. Add Toast component to App.tsx (root level)
2. Screens inherit error handling from hooks
3. Optional: Add screen-specific error context logging

**Screens to Update**:
- ✅ App.tsx (add Toast container)
- ✅ HomeScreen.tsx (minimal changes)
- ✅ MapScreen.tsx (minimal changes)
- ✅ DetailsScreen.tsx (minimal changes)
- ✅ FavoritesScreen.tsx (minimal changes)
- ✅ SettingsScreen.tsx (minimal changes)

---

## Testing Contract

### Unit Tests

Test the error notification service in isolation:

```typescript
describe('ErrorNotificationService', () => {
  it('should show critical error as Alert', () => {
    errorNotificationService.showError({
      type: ErrorType.Permission,
      source: ErrorSource.LocationService,
      severity: ErrorSeverity.Critical,
      messageKey: 'errors.location.permissionDenied'
    });
    
    expect(Alert.alert).toHaveBeenCalled();
  });
  
  it('should deduplicate errors within 5 seconds', () => {
    const options = {
      type: ErrorType.Network,
      source: ErrorSource.AttractionsService,
      severity: ErrorSeverity.Warning,
      messageKey: 'errors.network.timeout'
    };
    
    errorNotificationService.showError(options);
    errorNotificationService.showError(options); // Should be ignored
    
    expect(Toast.show).toHaveBeenCalledTimes(1);
  });
  
  it('should log technical details to console', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    
    errorNotificationService.showError({
      type: ErrorType.Storage,
      source: ErrorSource.StorageService,
      severity: ErrorSeverity.Warning,
      messageKey: 'errors.storage.saveFailed',
      error: new Error('Storage full')
    });
    
    expect(consoleSpy).toHaveBeenCalled();
  });
});
```

### Integration Tests

Test error handling in services and hooks:

```typescript
describe('LocationService error handling', () => {
  it('should show error when permission denied', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false
    });
    
    await locationService.getCurrentPosition();
    
    expect(errorNotificationService.showLocationError).toHaveBeenCalled();
  });
});
```

---

## Backward Compatibility

This feature adds new functionality without breaking existing code:

- ✅ Existing `console.error` calls remain functional
- ✅ Services continue to throw errors for caller handling
- ✅ Hooks maintain existing error state patterns
- ✅ No changes to public service APIs

**Migration Strategy**:
1. Implement error notification service
2. Add error notifications to services (alongside existing console.log)
3. Test thoroughly
4. Optionally remove console.error calls once error notifications verified

---

## Performance Considerations

### Synchronous Operations

Error notification is synchronous and fast:
- Error categorization: <1ms
- Deduplication check: O(1) Map lookup
- i18n translation: <5ms
- Toast display: <100ms

### Asynchronous Operations

Recovery actions are async but don't block:
- OpenSettings: Platform-dependent launch time
- Retry: Depends on retried operation
- Dismiss: Immediate

### Memory Usage

Minimal memory footprint:
- Error cache: ~5KB for 50 entries
- Toast library: ~50KB bundle size
- No persistent storage

---

## Versioning

**Current Version**: 1.0.0

**Future API Changes**:
- v1.1.0: Add `showSuccessNotification` for positive feedback
- v1.2.0: Add error analytics tracking
- v2.0.0: Breaking change - Add error persistence

---

## Related Documents

- [spec.md](../spec.md) - Feature specification
- [data-model.md](../data-model.md) - Data structures
- [research.md](../research.md) - Technical decisions
- [quickstart.md](../quickstart.md) - Implementation guide
