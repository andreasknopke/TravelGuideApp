# Data Model: User-Facing Error Notifications

**Feature**: 003-error-notifications  
**Date**: 2025-12-11

## Overview

This document defines the data structures and types used by the error notification system. The model supports error categorization, severity levels, recovery actions, and i18n message mapping.

## Core Entities

### ErrorNotification

Represents a user-facing error notification with all information needed for display and logging.

**Attributes**:
- `id`: string (unique identifier for deduplication)
- `type`: ErrorType (category of error)
- `source`: ErrorSource (origin of error)
- `severity`: ErrorSeverity (display urgency)
- `messageKey`: string (i18n translation key)
- `messageParams`: Record<string, any> (interpolation values for translation)
- `timestamp`: number (when error occurred)
- `technicalDetails`: ErrorContext (for console logging)
- `recoveryActions`: RecoveryAction[] (available user actions)

**Relationships**:
- Has one ErrorContext (debug information)
- Has zero or more RecoveryActions (user options)

**Validation Rules**:
- `id` must be unique within active notification set
- `messageKey` must exist in i18n translation files
- `severity` determines display method (Alert vs Toast)
- `timestamp` used for deduplication window

**State Transitions**:
```
Created → Shown → (Auto-dismissed | User-dismissed | Recovered)
```

---

### ErrorContext

Contains detailed technical information for debugging, never shown to users.

**Attributes**:
- `errorType`: string (JavaScript error type: Error, TypeError, etc.)
- `message`: string (original error message)
- `stack`: string | undefined (stack trace if available)
- `serviceName`: string (which service threw error)
- `methodName`: string (which method failed)
- `inputParams`: any (parameters passed to method)
- `httpStatus`: number | undefined (HTTP status code if network error)
- `requestUrl`: string | undefined (API endpoint if applicable)

**Relationships**:
- Belongs to one ErrorNotification

**Validation Rules**:
- `serviceName` and `methodName` required for all errors
- `httpStatus` and `requestUrl` required only for network errors
- `stack` captured when available (development mode)

---

### RecoveryAction

Defines an action the user can take to resolve or dismiss the error.

**Attributes**:
- `type`: RecoveryActionType (OpenSettings, Retry, Dismiss)
- `labelKey`: string (i18n key for button text)
- `callback`: () => void | Promise<void> (action handler)
- `primary`: boolean (whether this is the suggested action)

**Relationships**:
- Belongs to one ErrorNotification

**Validation Rules**:
- Every ErrorNotification must have at least "Dismiss" action
- Maximum one primary action per notification
- OpenSettings only for permission-related errors

---

### ErrorSignature

Used for deduplication - identifies unique error types to prevent spam.

**Attributes**:
- `type`: ErrorType
- `source`: ErrorSource
- `severity`: ErrorSeverity

**Relationships**:
- Derives from ErrorNotification for deduplication

**Validation Rules**:
- Serializable for Map key usage
- Immutable after creation

---

## Enumerations

### ErrorType

Categories of errors by their nature:

```typescript
enum ErrorType {
  Location = 'location',
  Network = 'network',
  Storage = 'storage',
  API = 'api',
  Permission = 'permission',
  Validation = 'validation',
  Unknown = 'unknown'
}
```

**Usage**: Determines error message template and recovery actions

---

### ErrorSource

Specific service or component that generated the error:

```typescript
enum ErrorSource {
  // Services
  LocationService = 'locationService',
  AttractionsService = 'attractionsService',
  WikiService = 'wikiService',
  OpenAIService = 'openaiService',
  StorageService = 'storageService',
  FavoritesService = 'favoritesService',
  InterestsService = 'interestsService',
  
  // Hooks
  UseLocation = 'useLocation',
  UseAttractions = 'useAttractions',
  UseFavorites = 'useFavorites',
  
  // Screens
  HomeScreen = 'homeScreen',
  MapScreen = 'mapScreen',
  DetailsScreen = 'detailsScreen',
  FavoritesScreen = 'favoritesScreen',
  SettingsScreen = 'settingsScreen',
  
  // System
  System = 'system',
  Unknown = 'unknown'
}
```

**Usage**: Provides context for error logging and debugging

---

### ErrorSeverity

Urgency level determining display style:

```typescript
enum ErrorSeverity {
  Critical = 'critical',  // Blocks functionality, requires immediate attention
  Warning = 'warning',    // Degrades experience but doesn't block
  Info = 'info'          // Informational, no user action needed
}
```

**Display Mapping**:
- `Critical`: React Native Alert API (modal dialog)
- `Warning`: Toast notification (top position, 4s auto-dismiss)
- `Info`: Toast notification (bottom position, 3s auto-dismiss)

---

### RecoveryActionType

Actions available to users for error resolution:

```typescript
enum RecoveryActionType {
  OpenSettings = 'openSettings',  // Navigate to system settings
  Retry = 'retry',                // Re-attempt failed operation
  Dismiss = 'dismiss',            // Close notification
  Refresh = 'refresh'             // Reload screen data (future)
}
```

**Implementation**:
- `OpenSettings`: Uses `Linking.openSettings()` from expo-linking
- `Retry`: Executes provided callback function
- `Dismiss`: Closes notification UI
- `Refresh`: Reserved for future implementation

---

## Data Flows

### Error Creation Flow

```
Error occurs in service/hook
  ↓
Service creates error with context
  ↓
Error notification service receives error
  ↓
ErrorNotification entity created
  ↓
Error signature checked for deduplication
  ↓
If not duplicate: Display to user + Log to console
```

---

### Error Display Flow

```
ErrorNotification ready
  ↓
Check severity
  ↓
If Critical: Alert.alert() (React Native)
If Warning/Info: Toast.show() (react-native-toast-message)
  ↓
Apply i18n translation to message
  ↓
Interpolate dynamic values (messageParams)
  ↓
Render recovery action buttons
  ↓
Log full ErrorContext to console
```

---

### Error Recovery Flow

```
User taps recovery action button
  ↓
Execute RecoveryAction callback
  ↓
If OpenSettings: Launch system settings
If Retry: Re-execute failed operation
If Dismiss: Close notification
  ↓
Log recovery action to console
  ↓
Remove from active notifications
```

---

## Error Message Templates

### Location Errors

```typescript
location: {
  permissionDenied: {
    severity: ErrorSeverity.Critical,
    messageKey: 'errors.location.permissionDenied',
    recoveryActions: [OpenSettings, Dismiss]
  },
  unavailable: {
    severity: ErrorSeverity.Warning,
    messageKey: 'errors.location.unavailable',
    recoveryActions: [Retry, Dismiss]
  },
  timeout: {
    severity: ErrorSeverity.Warning,
    messageKey: 'errors.location.timeout',
    messageParams: { seconds: 10 },
    recoveryActions: [Retry, Dismiss]
  }
}
```

### Network Errors

```typescript
network: {
  offline: {
    severity: ErrorSeverity.Critical,
    messageKey: 'errors.network.offline',
    recoveryActions: [Retry, Dismiss]
  },
  timeout: {
    severity: ErrorSeverity.Warning,
    messageKey: 'errors.network.timeout',
    recoveryActions: [Retry, Dismiss]
  },
  serverError: {
    severity: ErrorSeverity.Warning,
    messageKey: 'errors.network.serverError',
    recoveryActions: [Retry, Dismiss]
  }
}
```

### Storage Errors

```typescript
storage: {
  saveFailed: {
    severity: ErrorSeverity.Warning,
    messageKey: 'errors.storage.saveFailed',
    messageParams: { itemType: 'favorite' },
    recoveryActions: [Retry, Dismiss]
  },
  loadFailed: {
    severity: ErrorSeverity.Warning,
    messageKey: 'errors.storage.loadFailed',
    recoveryActions: [Retry, Dismiss]
  }
}
```

### API Errors

```typescript
api: {
  openaiUnavailable: {
    severity: ErrorSeverity.Info,
    messageKey: 'errors.api.openaiUnavailable',
    recoveryActions: [Dismiss]
  },
  wikiUnavailable: {
    severity: ErrorSeverity.Info,
    messageKey: 'errors.api.wikiUnavailable',
    recoveryActions: [Dismiss]
  },
  rateLimited: {
    severity: ErrorSeverity.Warning,
    messageKey: 'errors.api.rateLimited',
    messageParams: { seconds: 60 },
    recoveryActions: [Dismiss]
  }
}
```

---

## Storage Considerations

### In-Memory State

**ErrorCache**: Map<string, number>
- Key: Serialized ErrorSignature
- Value: Timestamp of last display
- Purpose: Deduplication within 5-second window
- Lifecycle: Cleared on app restart
- Size: ~50 entries max (automatic cleanup of old entries)

### Persistent Storage (Optional - Future)

**User Preferences** (AsyncStorage):
- "Don't show this again" flags per error type
- Error notification preferences (enable/disable by severity)
- Not implemented in initial version

---

## Type Safety

All entities will be defined as TypeScript interfaces/types to ensure compile-time safety:

```typescript
// Example type definitions
interface ErrorNotification {
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

interface RecoveryAction {
  type: RecoveryActionType;
  labelKey: string;
  callback: () => void | Promise<void>;
  primary: boolean;
}

interface ErrorSignature {
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
}
```

---

## Validation & Constraints

### Notification Limits
- Maximum 3 simultaneous notifications visible
- Older notifications auto-dismissed when limit reached
- Queue processed FIFO for display

### Message Length
- Error messages: 50-150 characters (user-friendly length)
- Technical details: Unlimited (console only)

### Deduplication Window
- 5 seconds for identical error signatures
- Prevents notification spam
- Configurable for testing

### Performance Constraints
- Notification display <100ms from error occurrence
- Zero UI blocking during error handling
- Maintain 60fps during animations

---

## Future Enhancements (Out of Scope)

- Error persistence across app restarts
- Error analytics and aggregation
- User preference for notification types
- Custom error recovery wizards
- Error reporting to external services
