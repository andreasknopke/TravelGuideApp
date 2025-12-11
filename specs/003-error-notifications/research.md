# Research: User-Facing Error Notifications

**Feature**: 003-error-notifications  
**Date**: 2025-12-11  
**Status**: Complete

## Research Questions

### 1. Toast Notification Library Selection

**Question**: Which React Native toast/notification library best fits our requirements (offline-capable, i18n support, customizable, performant)?

**Options Evaluated**:
1. **react-native-toast-message** (4.5k stars)
   - Pros: Highly customizable, built-in presets, TypeScript support, no native dependencies
   - Cons: Requires manual setup of toast container
   - Bundle size: ~50KB

2. **React Native Alert API** (built-in)
   - Pros: Native, zero dependencies, platform-consistent dialogs
   - Cons: Only supports blocking modal alerts, limited customization
   - Bundle size: 0KB (built-in)

3. **react-native-paper Snackbar** (from react-native-paper)
   - Pros: Material Design, works with existing design system
   - Cons: Requires entire react-native-paper library (~800KB), Material Design may not fit app design
   - Bundle size: Large if not already using Paper

**Decision**: Use **React Native Alert API for critical errors** + **react-native-toast-message for warnings/info**

**Rationale**:
- Alert API is perfect for critical blocking errors (location permission denied)
- Toast library provides non-blocking notifications for warnings
- Minimal bundle impact (~50KB for toast library)
- No native dependencies keeps build simple
- Both support i18n through message customization

**Alternatives Considered**: 
- Snackbar from react-native-paper rejected due to large bundle size
- Custom implementation rejected to avoid reinventing stable libraries

---

### 2. Error Categorization Strategy

**Question**: How should errors be categorized to determine display style (critical alert vs. warning toast)?

**Approaches Evaluated**:
1. **By Error Source**: Location, Network, Storage, API, Permission
2. **By Severity**: Critical, Warning, Info
3. **By Impact**: Blocking (prevents feature use) vs. Non-blocking (degrades experience)
4. **By Recovery**: Recoverable (user can fix) vs. Non-recoverable (requires developer fix)

**Decision**: Use **Severity + Source** hybrid categorization

**Rationale**:
- Severity determines display style (Alert vs Toast)
- Source determines error message template and recovery actions
- Example: `NetworkError.Critical` vs `NetworkError.Warning`
- Matches user mental model (how urgent + what failed)

**Categorization Rules**:
```
CRITICAL (Alert Dialog):
- Location permission permanently denied
- Storage failure preventing core functionality
- Network failure on initial data load

WARNING (Toast - 3-5s auto-dismiss):
- API rate limiting
- Cached data used instead of fresh data
- Non-critical service degradation

INFO (Toast - 2-3s auto-dismiss):
- Classification skipped (OpenAI)
- Background operation completed with partial success
- Debug information for developers
```

**Alternatives Considered**:
- Source-only rejected: doesn't convey urgency
- Impact-only rejected: too subjective to implement
- Recovery-based rejected: difficult to determine automatically

---

### 3. Error Message Translation Strategy

**Question**: How should error messages be structured in i18n to support dynamic data (error codes, retry counts, etc.)?

**Options Evaluated**:
1. **Static Messages**: Predefined translations with no dynamic content
2. **Template Strings**: i18n keys with interpolation support
3. **Error Code Mapping**: Map error codes to translation keys
4. **Contextual Messages**: Different messages based on user state

**Decision**: Use **Template Strings with Error Code Mapping**

**Rationale**:
- i18next already supports interpolation (e.g., `{{retryCount}}`)
- Error codes provide stable keys for translation
- Allows dynamic data while maintaining translation consistency
- Supports context-specific messaging

**Implementation Pattern**:
```typescript
// Translation keys structure
errors: {
  location: {
    permissionDenied: "Location access is required to find nearby attractions. Please enable location in settings.",
    unavailable: "Unable to determine your location. Please try again.",
    timeout: "Location request timed out after {{seconds}} seconds."
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
    rateLimited: "Too many requests. Please wait {{seconds}} seconds."
  }
}
```

**Alternatives Considered**:
- Static messages rejected: too inflexible for dynamic data
- Context-only rejected: adds complexity without clear benefit
- Error code only rejected: poor developer experience

---

### 4. Error Deduplication Strategy

**Question**: How should we prevent showing the same error multiple times when rapid failures occur?

**Approaches Evaluated**:
1. **Time-based Debouncing**: Suppress duplicate errors within N seconds
2. **Error Signature Matching**: Compare error type + source + message
3. **Queue with Deduplication**: Single error queue that deduplicates
4. **User Dismissal Tracking**: Track which errors user has dismissed

**Decision**: Use **Error Signature Matching + Time-based Debouncing** (5-second window)

**Rationale**:
- Prevents notification spam from rapid failures
- 5-second window balances responsiveness vs. annoyance
- Signature matching (type + source) catches identical errors
- Simple to implement and reason about

**Implementation**:
```typescript
interface ErrorSignature {
  type: ErrorType;
  source: ErrorSource;
  severity: ErrorSeverity;
}

// Track last shown time per signature
const errorCache = new Map<string, number>();

function shouldShowError(signature: ErrorSignature): boolean {
  const key = JSON.stringify(signature);
  const lastShown = errorCache.get(key);
  const now = Date.now();
  
  if (!lastShown || now - lastShown > 5000) {
    errorCache.set(key, now);
    return true;
  }
  return false;
}
```

**Alternatives Considered**:
- Queue-based rejected: over-engineered for mobile app
- User dismissal tracking rejected: adds storage complexity
- No deduplication rejected: poor user experience

---

### 5. Error Recovery Actions

**Question**: Which recovery actions should be implemented and how should they integrate with platform APIs?

**Recovery Actions Identified**:
1. **Open Settings**: Navigate to system settings for permissions
2. **Retry**: Re-attempt failed operation
3. **Dismiss**: Close notification
4. **Refresh**: Reload current screen data

**Decision**: Implement **Open Settings** (location permissions) + **Retry** + **Dismiss**

**Rationale**:
- Open Settings: Essential for permission errors, uses `Linking.openSettings()`
- Retry: Common user expectation for transient failures
- Dismiss: Always available for user control
- Refresh omitted: redundant with retry in most cases

**Platform Integration**:
```typescript
// Open Settings (uses Expo Linking)
import * as Linking from 'expo-linking';

async function openSettings() {
  await Linking.openSettings();
}

// Retry callback pattern
interface ErrorNotificationOptions {
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
}
```

**Alternatives Considered**:
- Copy Error Details rejected: adds complexity, console logs sufficient
- Report Bug rejected: out of scope for this feature
- Navigate to Help rejected: no help system exists

---

## Best Practices Research

### React Native Error Handling Patterns

**Sources**: React Native docs, React Error Boundaries documentation

**Key Patterns**:
1. **Error Boundaries**: Catch React component errors (already likely implemented in App.tsx)
2. **Try-Catch in Services**: Wrap async operations in try-catch blocks
3. **Error Propagation**: Services throw, hooks catch, components display
4. **Centralized Logging**: Single error logging service for consistency

**Recommendation**: Maintain existing service error handling patterns, add notification layer on top

---

### Mobile Notification UX Best Practices

**Sources**: Apple HIG, Material Design guidelines

**Key Principles**:
1. **Non-blocking for non-critical**: Toasts/banners shouldn't interrupt user flow
2. **Actionable messaging**: Tell user what went wrong AND what they can do
3. **Timing**: Auto-dismiss non-critical after 3-5 seconds
4. **Position**: Top of screen for alerts, bottom for toasts (less intrusive)
5. **Animation**: Smooth slide-in/out, respect reduced motion preferences

**Recommendation**: 
- Critical: Alert API (center modal)
- Warning: Toast top position with 4-second auto-dismiss
- Info: Toast bottom position with 3-second auto-dismiss

---

### i18n for Error Messages

**Sources**: i18next documentation, React Native i18n best practices

**Key Principles**:
1. **Context over literals**: Use error categories as context keys
2. **Interpolation**: Support dynamic values in translations
3. **Fallbacks**: Always provide English fallback
4. **Consistency**: Use same terminology across errors (e.g., "unable to" vs "failed to")

**Recommendation**: Structure error translations hierarchically by source, use consistent language

---

## Technology Decisions Summary

| Decision Area | Choice | Bundle Impact | Risk Level |
|--------------|--------|---------------|------------|
| Toast Library | react-native-toast-message | +50KB | Low |
| Alert System | React Native Alert API | 0KB | None |
| Categorization | Severity + Source | 0KB | Low |
| i18n Strategy | Template Strings | 0KB | None |
| Deduplication | Signature + Time | 0KB | Low |
| Recovery Actions | Settings + Retry | 0KB | Low |

**Total Bundle Impact**: ~50KB (well under 500KB threshold)

**Risk Assessment**: All choices use stable, well-maintained libraries or built-in APIs. No new architectural patterns introduced.

---

## Open Questions Resolved

1. ✅ **Toast library selection**: react-native-toast-message chosen
2. ✅ **Error categorization**: Severity + Source hybrid approach
3. ✅ **i18n structure**: Template strings with error code mapping
4. ✅ **Deduplication**: Error signature matching with 5-second window
5. ✅ **Recovery actions**: Open Settings, Retry, Dismiss

**Ready for Phase 1**: All technical decisions made, no NEEDS CLARIFICATION markers remain.
