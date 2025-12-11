# Data Model: Location Search and GPS UX Improvements

**Feature**: Location Search and GPS UX Improvements  
**Date**: December 11, 2025  
**Phase**: 1 - Design

## Overview

This document defines the data structures and state management for location search functionality, GPS tracking status, and search result handling. All entities extend or complement the existing type system defined in `src/types/index.ts`.

---

## Core Entities

### SearchResult

Represents a single location result from the geocoding search API.

**Purpose**: Encapsulate search results with sufficient information for user disambiguation and subsequent Wikipedia article lookup.

**Fields**:
- `id`: `string` - Unique identifier for the search result (from OSM place_id)
- `displayName`: `string` - Full formatted name for display (e.g., "Berlin, Germany")
- `primaryName`: `string` - Main location name (e.g., "Berlin")
- `secondaryInfo`: `string` - Disambiguation info (e.g., "Germany, Capital city")
- `coordinates`: `Coordinates` - Latitude and longitude of the location
- `type`: `string` - Location type (e.g., "city", "town", "village", "landmark")
- `importance`: `number` - Relevance score from geocoding API (0.0 to 1.0)

**Relationships**:
- Coordinates field uses existing `Coordinates` type from `src/types/index.ts`
- Selected search result converts to `CityInfo` for consistency with GPS-detected locations

**Validation Rules**:
- `id` must be non-empty string
- `coordinates` must have valid latitude (-90 to 90) and longitude (-180 to 180)
- `importance` must be between 0.0 and 1.0
- `displayName` and `primaryName` must be non-empty strings

**State Transitions**:
```
[API Response] → SearchResult → [User Selection] → CityInfo → [Wikipedia Lookup]
```

---

### GPSStatus

Represents the current state of GPS tracking and location services.

**Purpose**: Provide comprehensive GPS state information for UI status indicators and error handling.

**Type**: Enum with the following values:
- `ACTIVE` - GPS enabled, signal available, actively tracking user location
- `SEARCHING` - GPS enabled, waiting for signal acquisition
- `UNAVAILABLE` - GPS enabled but signal cannot be acquired (indoor, blocked)
- `PERMISSION_DENIED` - User has not granted location permissions
- `DISABLED` - GPS is intentionally disabled by user

**Usage**:
```typescript
type GPSStatus = 'ACTIVE' | 'SEARCHING' | 'UNAVAILABLE' | 'PERMISSION_DENIED' | 'DISABLED';
```

**State Transitions**:
```
DISABLED → [User enables GPS] → SEARCHING
SEARCHING → [Signal acquired] → ACTIVE
SEARCHING → [Timeout] → UNAVAILABLE
ACTIVE → [Signal lost] → UNAVAILABLE
ACTIVE → [User disables GPS] → DISABLED
PERMISSION_DENIED → [User grants permission] → SEARCHING
```

**Relationships**:
- Used by `useLocation` hook to expose GPS state
- Drives UI rendering of GPS status indicator component
- Influences availability of "center on location" button

---

### LocationSearchState

Represents the state of location search functionality.

**Purpose**: Manage search query, results, loading states, and errors in a centralized structure.

**Fields**:
- `query`: `string` - Current search query text
- `results`: `SearchResult[]` - Array of search results (empty if no search performed)
- `loading`: `boolean` - True when search is in progress
- `error`: `string | null` - Error message if search failed, null otherwise
- `selectedResult`: `SearchResult | null` - Currently selected result from the list

**Validation Rules**:
- `results` should be sorted by `importance` score (descending)
- `loading` and `error` should be mutually exclusive (not both true)
- Maximum 10 results stored (API limit)

**State Lifecycle**:
```
[Initial] → {query: '', results: [], loading: false, error: null, selectedResult: null}
[User types] → {query: 'Berlin', results: [], loading: false, error: null, selectedResult: null}
[Debounce triggers] → {query: 'Berlin', results: [], loading: true, error: null, selectedResult: null}
[API returns] → {query: 'Berlin', results: [...], loading: false, error: null, selectedResult: null}
[User selects] → {query: 'Berlin', results: [...], loading: false, error: null, selectedResult: {...}}
```

---

## Extended Entities

### Coordinates (existing, no changes)

Remains unchanged from existing implementation in `src/types/index.ts`.

```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}
```

---

### CityInfo (existing, potential enhancement)

Currently defined in `src/types/index.ts`. May need enhancement to support both GPS-detected and manually searched cities.

**Existing Fields**:
- `name`: `string` - City name
- `country`: `string` - Country name
- `coordinates`: `Coordinates` - Location coordinates

**Potential Enhancement** (to be determined during implementation):
- `source`: `'gps' | 'search'` - How the city was determined
- `confidence`: `number` - Confidence level for reverse geocode (0.0 to 1.0)

*Note: Enhancement only if needed to differentiate behavior between GPS and search origins.*

---

## Service Contracts

### LocationService.searchLocations()

New method to be added to existing `LocationService` class.

**Signature**:
```typescript
async searchLocations(query: string, limit?: number): Promise<SearchResult[]>
```

**Parameters**:
- `query`: Search string entered by user
- `limit`: Maximum results to return (default: 10, max: 20)

**Returns**: Array of SearchResult objects sorted by importance

**Errors**: Throws error with user-friendly message for network failures

---

### LocationService.selectSearchResult()

New method to convert SearchResult to CityInfo for consistency.

**Signature**:
```typescript
selectSearchResult(result: SearchResult): CityInfo
```

**Parameters**:
- `result`: Selected SearchResult from search

**Returns**: CityInfo object compatible with existing location state

**Purpose**: Normalize search results to match GPS-detected location format

---

## State Management Patterns

### Hook: useLocationSearch

New custom hook for managing search state.

**Returns**:
```typescript
{
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  selectedResult: SearchResult | null;
  setQuery: (query: string) => void;
  selectResult: (result: SearchResult) => void;
  clearSearch: () => void;
}
```

**Behavior**:
- Debounces search queries by 300ms
- Automatically triggers search when query changes
- Handles errors and loading states
- Provides clear/reset functionality

---

### Hook: useLocation (enhanced)

Existing hook with GPS status enhancement.

**New Return Fields**:
```typescript
{
  // ... existing fields
  gpsStatus: GPSStatus;
  centerOnLocation: () => Promise<void>;
}
```

**Behavior**:
- Tracks GPS state changes through expo-location events
- Provides method to trigger GPS location detection on demand
- Maintains existing functionality for location tracking

---

## Data Flow Diagrams

### Search Flow

```
User Input → useLocationSearch hook → locationService.searchLocations()
                                              ↓
                                    Nominatim API Request
                                              ↓
                                    Parse to SearchResult[]
                                              ↓
                                    Return to hook state
                                              ↓
User Selection → selectResult() → Convert to CityInfo → Update app location state
                                              ↓
                                    Trigger Wikipedia fetch
                                              ↓
                                    Display article in WebView
```

### GPS Status Flow

```
App Start → useLocation → Request Permissions
                              ↓
                    PERMISSION_DENIED or SEARCHING
                              ↓
                    Start Location Watching
                              ↓
            Signal Acquired → ACTIVE ↔ [Movement updates]
                    ↓                          ↓
            Signal Lost → UNAVAILABLE    User Disables → DISABLED
```

---

## Storage Considerations

### Cached Search Results (optional, for performance)

**Key**: `@travel-guide/search-cache`  
**Value**: Map of query strings to SearchResult arrays  
**TTL**: 1 hour (refresh if older)  
**Max Size**: 50 queries (LRU eviction)  

*Note: Implementation optional based on performance testing. Start without caching.*

### Map Data (existing, modified)

Current `MapData` structure in storage may need enhancement to include search-derived locations:

```typescript
interface MapData {
  location: Coordinates;
  attractions: Attraction[];
  useGPS: boolean;
  locationSource?: 'gps' | 'search';  // [NEW] Optional field
  cityName?: string;                   // [NEW] Optional field for search results
}
```

---

## Validation & Constraints

### Input Validation

- Search query: 2-100 characters, trim whitespace
- Debounce delay: 300ms (balance between responsiveness and API load)
- Rate limiting: Max 1 request per second to Nominatim API
- Results limit: 10 results default, 20 maximum

### Error Handling

- Network timeout: 10 seconds, show user-friendly message
- Empty results: Display "No locations found for [query]"
- API rate limit exceeded: Show "Search temporarily unavailable, please try again"
- Invalid coordinates: Filter out results with invalid lat/lon values

---

## Type Definitions Summary

All types to be added to `src/types/index.ts`:

```typescript
export interface SearchResult {
  id: string;
  displayName: string;
  primaryName: string;
  secondaryInfo: string;
  coordinates: Coordinates;
  type: string;
  importance: number;
}

export type GPSStatus = 
  | 'ACTIVE' 
  | 'SEARCHING' 
  | 'UNAVAILABLE' 
  | 'PERMISSION_DENIED' 
  | 'DISABLED';

export interface LocationSearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  selectedResult: SearchResult | null;
}
```

---

## Testing Considerations

### Test Data Fixtures

Create fixtures for:
- Sample SearchResult arrays (various location types)
- GPS status transitions
- Edge cases (empty results, malformed API responses, network errors)

### Mock Requirements

- Nominatim API responses (successful, empty, error)
- GPS status changes (permission changes, signal loss)
- Location service methods (search, select)

### Validation Tests

- SearchResult field validation (coordinates, importance bounds)
- GPS status state machine transitions
- Search query sanitization and length limits
