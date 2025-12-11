# Data Model: Complete Internationalization

**Feature**: 002-complete-i18n  
**Date**: 2025-12-11  
**Status**: Complete

## Overview

This feature involves refactoring existing UI strings and code comments, not introducing new data entities. The "data" here consists of translation key-value pairs and language state. No database schema changes, no new domain models.

## Core Entities

### Translation Key

**Description**: Identifier for a translatable string used throughout the application.

**Attributes**:
- **key** (string, required): Unique identifier in camelCase format (e.g., `noFavoritesSaved`)
- **category** (implicit): Semantic grouping (empty states, actions, errors, etc.)

**Validation Rules**:
- Must be unique across all translations
- Must use camelCase convention
- Must be semantic (describe meaning, not location)
- Should not exceed 50 characters for readability

**Example**:
```typescript
'noFavoritesSaved'
'gpsMode'
'errorTitle'
```

---

### Translation Value

**Description**: Localized text for a specific language corresponding to a translation key.

**Attributes**:
- **text** (string, required): The translated text in the target language
- **language** (string, required): Language code ('de' or 'en')
- **interpolations** (array of strings, optional): Variable placeholders in the text (e.g., `{{city}}`)

**Validation Rules**:
- Must not be empty
- If interpolations exist, must include placeholder syntax: `{{variableName}}`
- Should preserve formatting characters (emoji, punctuation)
- Must be appropriate for the UI context (length constraints for buttons, etc.)

**Relationships**:
- One Translation Key → Many Translation Values (one per supported language)

**Example**:
```typescript
// Key: 'learnMoreAbout'
{
  de: 'Mehr über {{city}} erfahren',
  en: 'Learn more about {{city}}'
}
```

---

### Language Context

**Description**: Current user language preference, maintained by i18next.

**Attributes**:
- **currentLanguage** (string): Active language code ('de' | 'en')
- **fallbackLanguage** (string): Default language when translation missing ('de')

**State Transitions**:
```
Initial State: 'de' (German - app default)
     ↓
User selects English in Settings
     ↓
Active State: 'en' (English)
     ↓
User switches back to German
     ↓
Active State: 'de' (German)
```

**Validation Rules**:
- Must be one of supported languages: ['de', 'en']
- Language changes trigger immediate UI re-render
- Persisted to AsyncStorage for app restart

**Storage Location**: Managed by i18next, persisted via AsyncStorage

---

### AI Prompt Template

**Description**: Language-specific prompt templates for OpenAI API calls.

**Attributes**:
- **language** (string, required): Language code for the prompt ('de' | 'en')
- **promptType** (string, required): Purpose of prompt ('scoring' | 'description')
- **template** (string, required): The actual prompt text with instruction

**Example**:
```typescript
{
  language: 'de',
  promptType: 'scoring',
  template: 'Du bist ein Reise-Experte. Bewerte Sehenswürdigkeiten basierend auf Benutzerinteressen...'
}

{
  language: 'en',
  promptType: 'scoring',
  template: 'You are a travel expert. Rate attractions based on user interests...'
}
```

**Relationships**:
- Prompt selection driven by Language Context
- One prompt type → Two templates (one per language)

---

## Translation Key Inventory

### Empty States (6 keys)

| Key | German | English | Used In |
|-----|--------|---------|---------|
| `noFavoritesSaved` | Keine Favoriten gespeichert | No favorites saved | FavoritesScreen |
| `noInformationAvailable` | Keine Informationen verfügbar | No information available | DetailsScreen |
| `noWikipediaData` | Keine Wikipedia-Daten für diesen Ort verfügbar | No Wikipedia data available for this location | DetailsScreen |
| `noPersonalizedInfo` | Keine personalisierten Informationen verfügbar | No personalized information available | DetailsScreen |
| `mapOnlyMobileApp` | 💡 Kartenansicht ist nur in der mobilen App verfügbar | 💡 Map view is only available in mobile app | MapScreen |
| `errorOccurred` | Fehler | Error | Multiple screens |

### Mode & Navigation Labels (2 keys)

| Key | German | English | Used In |
|-----|--------|---------|---------|
| `gpsMode` | 📍 GPS-Modus | 📍 GPS Mode | HomeScreen |
| `manualSearch` | 🔍 Manuelle Suche | 🔍 Manual Search | HomeScreen |

### Action Buttons (3 keys)

| Key | German | English | Used In |
|-----|--------|---------|---------|
| `searchButton` | Suchen | Search | HomeScreen |
| `retryButton` | Erneut versuchen | Try Again | MapScreen |
| `getLocation` | Standort abrufen | Get Location | MapScreen |

### Input Placeholders (1 key)

| Key | German | English | Used In |
|-----|--------|---------|---------|
| `enterLocationPlaceholder` | Ort eingeben (z.B. Bad Doberan) | Enter location (e.g. Bad Doberan) | HomeScreen |

### AI/Personalization Labels (4 keys)

| Key | German | English | Used In |
|-----|--------|---------|---------|
| `interestingForYou` | Für dich interessant | Interesting for you | DetailsScreen |
| `sourceWikipedia` | Quelle: Wikipedia | Source: Wikipedia | DetailsScreen |
| `personalizedDescription` | Personalisierte Beschreibung | Personalized Description | DetailsScreen |
| `myInterests` | Meine Interessen | My Interests | SettingsScreen |

### Prompts & Instructions (2 keys)

| Key | German | English | Used In |
|-----|--------|---------|---------|
| `selectInterestsPrompt` | Wähle deine Interessen aus, um personalisierte Empfehlungen zu erhalten: | Select your interests to get personalized recommendations: | SettingsScreen |
| `learnMoreAbout` | Mehr über {{city}} erfahren | Learn more about {{city}} | HomeScreen |

### Error Messages - Alerts (4 keys)

| Key | German | English | Used In |
|-----|--------|---------|---------|
| `locationNotFoundError` | Ort nicht gefunden | Location not found | HomeScreen |
| `locationSearchError` | Fehler bei der Ortssuche | Error searching location | HomeScreen |
| `navigationError` | Konnte nicht zu den Details navigieren | Could not navigate to details | MapScreen |
| `routePlannerError` | Routenplaner konnte nicht geöffnet werden | Could not open route planner | HomeScreen |

**Total New Keys**: 22

---

## Code Comment Entities

### German Comment

**Description**: Inline code comment written in German language.

**Attributes**:
- **location** (file path + line number)
- **originalText** (string): The German comment
- **englishTranslation** (string): The English replacement

**Known Instances**:

| Location | Original (German) | Replacement (English) |
|----------|-------------------|----------------------|
| DetailsScreen.tsx:72 | `// Wenn keine Wikipedia-Daten vorhanden, zeige "Für dich interessant"` | `// If no Wikipedia data available, show "Interesting for you"` |
| DetailsScreen.tsx:73 | includes condition check with German string | Update to use i18n key reference in comment |

**Validation Rule**: After implementation, `grep -rn "\/\/ .*[äöüÄÖÜß]" src/` must return zero matches.

---

## State Transitions

### Translation Loading Flow

```
App Start
    ↓
Load i18n configuration (synchronous)
    ↓
Initialize with default language ('de')
    ↓
Check AsyncStorage for saved language preference
    ↓
If preference exists → Change to saved language
    ↓
Render UI with active translations
```

### Language Switch Flow

```
User in Settings Screen
    ↓
Taps language option (German → English)
    ↓
Call i18n.changeLanguage('en')
    ↓
i18next updates internal state
    ↓
Save preference to AsyncStorage
    ↓
All components re-render with new translations
    ↓
UI immediately reflects English text
```

### AI Prompt Selection Flow

```
User views attraction details
    ↓
DetailsScreen requests AI description
    ↓
openai.service.ts reads i18n.language
    ↓
Select prompt template for current language
    ↓
Send language-appropriate prompt to OpenAI
    ↓
Receive and display response
```

---

## Data Consistency Rules

### Translation Parity

**Rule**: Every translation key MUST have values for all supported languages (de, en).

**Validation**:
```typescript
const deKeys = Object.keys(resources.de.translation);
const enKeys = Object.keys(resources.en.translation);
// deKeys.length === enKeys.length
// deKeys.every(key => enKeys.includes(key))
```

**Enforcement**: Code review and manual verification before merge.

### Interpolation Consistency

**Rule**: If a translation value contains interpolation placeholders, ALL language variants must have the same placeholders.

**Example**:
```typescript
// ✅ VALID
de: 'Mehr über {{city}} erfahren'
en: 'Learn more about {{city}}'

// ❌ INVALID - missing placeholder in English
de: 'Mehr über {{city}} erfahren'
en: 'Learn more about this place'
```

### Key Naming Consistency

**Rule**: Translation keys must follow camelCase convention and semantic naming.

**Examples**:
- ✅ `noFavoritesSaved` (semantic, describes state)
- ✅ `searchButton` (semantic, describes action)
- ❌ `favoritesScreen_line_23` (positional, couples to implementation)
- ❌ `string_001` (generic, no semantic meaning)

---

## Migration Impact

### No Database Changes
- All translations stored in-memory JavaScript objects
- No SQL migrations required
- No data persistence layer changes

### Configuration File Changes
**File**: `src/config/i18n.ts`

**Before** (existing keys):
```typescript
const resources = {
  en: { translation: { /* ~30 existing keys */ } },
  de: { translation: { /* ~30 existing keys */ } }
};
```

**After** (with new keys):
```typescript
const resources = {
  en: { translation: { /* ~52 total keys (30 existing + 22 new) */ } },
  de: { translation: { /* ~52 total keys (30 existing + 22 new) */ } }
};
```

**Change Type**: Additive only (no breaking changes to existing keys)

---

## Summary

This feature's "data model" consists of:
- **22 new translation key-value pairs** across 2 languages (44 total new entries)
- **1 language-aware prompt selection** mechanism in OpenAI service
- **2+ German code comments** replaced with English equivalents
- **No new entities or domain models** - purely refactoring existing UI strings

All changes are additive and non-breaking. Existing functionality preserved while enabling proper internationalization support.
