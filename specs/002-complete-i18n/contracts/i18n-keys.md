# Contract: Translation Key Inventory

**Feature**: 002-complete-i18n  
**Date**: 2025-12-11  
**Purpose**: Define all translation keys to be added to i18n configuration

## Contract Overview

This contract specifies the exact translation keys and values that will be added to `src/config/i18n.ts`. All keys follow camelCase convention and semantic naming. Each key has corresponding German and English values.

## Translation Keys by Category

### Category: Empty States

```typescript
noFavoritesSaved: {
  de: 'Keine Favoriten gespeichert',
  en: 'No favorites saved'
}

noInformationAvailable: {
  de: 'Keine Informationen verfügbar.',
  en: 'No information available.'
}

noWikipediaData: {
  de: 'Keine Wikipedia-Daten für diesen Ort verfügbar.',
  en: 'No Wikipedia data available for this location.'
}

noPersonalizedInfo: {
  de: 'Keine personalisierten Informationen verfügbar.',
  en: 'No personalized information available.'
}

mapOnlyMobileApp: {
  de: '💡 Kartenansicht ist nur in der mobilen App verfügbar',
  en: '💡 Map view is only available in mobile app'
}
```

### Category: Mode & Navigation Labels

```typescript
gpsMode: {
  de: '📍 GPS-Modus',
  en: '📍 GPS Mode'
}

manualSearch: {
  de: '🔍 Manuelle Suche',
  en: '🔍 Manual Search'
}
```

### Category: Action Buttons

```typescript
searchButton: {
  de: 'Suchen',
  en: 'Search'
}

retryButton: {
  de: 'Erneut versuchen',
  en: 'Try Again'
}

getLocation: {
  de: 'Standort abrufen',
  en: 'Get Location'
}
```

### Category: Input Placeholders

```typescript
enterLocationPlaceholder: {
  de: 'Ort eingeben (z.B. Bad Doberan)',
  en: 'Enter location (e.g. Bad Doberan)'
}
```

### Category: AI & Personalization Labels

```typescript
interestingForYou: {
  de: 'Für dich interessant',
  en: 'Interesting for you'
}

sourceWikipedia: {
  de: 'Quelle: Wikipedia',
  en: 'Source: Wikipedia'
}

personalizedDescription: {
  de: 'Personalisierte Beschreibung',
  en: 'Personalized Description'
}

myInterests: {
  de: 'Meine Interessen',
  en: 'My Interests'
}
```

### Category: Prompts & Instructions

```typescript
selectInterestsPrompt: {
  de: 'Wähle deine Interessen aus, um personalisierte Empfehlungen zu erhalten:',
  en: 'Select your interests to get personalized recommendations:'
}

learnMoreAbout: {
  de: 'Mehr über {{city}} erfahren',
  en: 'Learn more about {{city}}'
}
```

### Category: Error Messages (Alert Titles & Messages)

```typescript
errorTitle: {
  de: 'Fehler',
  en: 'Error'
}

locationNotFoundError: {
  de: 'Ort nicht gefunden',
  en: 'Location not found'
}

locationSearchError: {
  de: 'Fehler bei der Ortssuche',
  en: 'Error searching location'
}

navigationError: {
  de: 'Konnte nicht zu den Details navigieren',
  en: 'Could not navigate to details'
}

routePlannerError: {
  de: 'Routenplaner konnte nicht geöffnet werden',
  en: 'Could not open route planner'
}
```

## Implementation Format

### i18n.ts Structure

```typescript
const resources = {
  en: {
    translation: {
      // ... existing keys ...
      
      // Empty States
      noFavoritesSaved: 'No favorites saved',
      noInformationAvailable: 'No information available.',
      noWikipediaData: 'No Wikipedia data available for this location.',
      noPersonalizedInfo: 'No personalized information available.',
      mapOnlyMobileApp: '💡 Map view is only available in mobile app',
      
      // Mode Labels
      gpsMode: '📍 GPS Mode',
      manualSearch: '🔍 Manual Search',
      
      // Action Buttons
      searchButton: 'Search',
      retryButton: 'Try Again',
      getLocation: 'Get Location',
      
      // Input Placeholders
      enterLocationPlaceholder: 'Enter location (e.g. Bad Doberan)',
      
      // AI & Personalization
      interestingForYou: 'Interesting for you',
      sourceWikipedia: 'Source: Wikipedia',
      personalizedDescription: 'Personalized Description',
      myInterests: 'My Interests',
      
      // Prompts
      selectInterestsPrompt: 'Select your interests to get personalized recommendations:',
      learnMoreAbout: 'Learn more about {{city}}',
      
      // Error Messages
      errorTitle: 'Error',
      locationNotFoundError: 'Location not found',
      locationSearchError: 'Error searching location',
      navigationError: 'Could not navigate to details',
      routePlannerError: 'Could not open route planner',
    },
  },
  de: {
    translation: {
      // ... existing keys ...
      
      // Empty States
      noFavoritesSaved: 'Keine Favoriten gespeichert',
      noInformationAvailable: 'Keine Informationen verfügbar.',
      noWikipediaData: 'Keine Wikipedia-Daten für diesen Ort verfügbar.',
      noPersonalizedInfo: 'Keine personalisierten Informationen verfügbar.',
      mapOnlyMobileApp: '💡 Kartenansicht ist nur in der mobilen App verfügbar',
      
      // Mode Labels
      gpsMode: '📍 GPS-Modus',
      manualSearch: '🔍 Manuelle Suche',
      
      // Action Buttons
      searchButton: 'Suchen',
      retryButton: 'Erneut versuchen',
      getLocation: 'Standort abrufen',
      
      // Input Placeholders
      enterLocationPlaceholder: 'Ort eingeben (z.B. Bad Doberan)',
      
      // AI & Personalization
      interestingForYou: 'Für dich interessant',
      sourceWikipedia: 'Quelle: Wikipedia',
      personalizedDescription: 'Personalisierte Beschreibung',
      myInterests: 'Meine Interessen',
      
      // Prompts
      selectInterestsPrompt: 'Wähle deine Interessen aus, um personalisierte Empfehlungen zu erhalten:',
      learnMoreAbout: 'Mehr über {{city}} erfahren',
      
      // Error Messages
      errorTitle: 'Fehler',
      locationNotFoundError: 'Ort nicht gefunden',
      locationSearchError: 'Fehler bei der Ortssuche',
      navigationError: 'Konnte nicht zu den Details navigieren',
      routePlannerError: 'Routenplaner konnte nicht geöffnet werden',
    },
  },
};
```

## Component Usage Examples

### FavoritesScreen.tsx

**Before**:
```typescript
<Text style={styles.emptyText}>Keine Favoriten gespeichert</Text>
```

**After**:
```typescript
const { t } = useTranslation();
<Text style={styles.emptyText}>{t('noFavoritesSaved')}</Text>
```

### HomeScreen.tsx

**Before**:
```typescript
<Text style={styles.modeText}>
  {useGPS ? '📍 GPS-Modus' : '🔍 Manuelle Suche'}
</Text>
<TextInput
  placeholder="Ort eingeben (z.B. Bad Doberan)"
  // ...
/>
<Text style={styles.searchButtonText}>Suchen</Text>
Alert.alert('Fehler', 'Ort nicht gefunden');
```

**After**:
```typescript
const { t } = useTranslation();
<Text style={styles.modeText}>
  {useGPS ? t('gpsMode') : t('manualSearch')}
</Text>
<TextInput
  placeholder={t('enterLocationPlaceholder')}
  // ...
/>
<Text style={styles.searchButtonText}>{t('searchButton')}</Text>
Alert.alert(t('errorTitle'), t('locationNotFoundError'));
```

### DetailsScreen.tsx

**Before**:
```typescript
<Text style={styles.sectionTitle}>Für dich interessant</Text>
{wikitravelData.extract || 'Keine Informationen verfügbar.'}
<Text style={styles.source}>Quelle: Wikipedia</Text>
```

**After**:
```typescript
const { t } = useTranslation();
<Text style={styles.sectionTitle}>{t('interestingForYou')}</Text>
{wikitravelData.extract || t('noInformationAvailable')}
<Text style={styles.source}>{t('sourceWikipedia')}</Text>
```

### MapScreen.tsx

**Before**:
```typescript
<Text>Standort abrufen</Text>
<Text style={styles.retryButtonText}>Erneut versuchen</Text>
Alert.alert('Fehler', 'Konnte nicht zu den Details navigieren');
```

**After**:
```typescript
const { t } = useTranslation();
<Text>{t('getLocation')}</Text>
<Text style={styles.retryButtonText}>{t('retryButton')}</Text>
Alert.alert(t('errorTitle'), t('navigationError'));
```

### SettingsScreen.tsx

**Before**:
```typescript
<Text style={styles.sectionTitle}>Meine Interessen</Text>
<Text style={styles.description}>
  Wähle deine Interessen aus, um personalisierte Empfehlungen zu erhalten:
</Text>
```

**After**:
```typescript
const { t } = useTranslation();
<Text style={styles.sectionTitle}>{t('myInterests')}</Text>
<Text style={styles.description}>{t('selectInterestsPrompt')}</Text>
```

### openai.service.ts - AI Prompts

**Before**:
```typescript
const scoringPrompt = `Du bist ein Reise-Experte. Bewerte Sehenswürdigkeiten basierend auf Benutzerinteressen.
Benutzerinteressen: ${interests.join(', ')}
Bewerte jede Sehenswürdigkeit von 1-10 basierend auf Relevanz...`;

const descriptionPrompt = `Du bist ein hilfreicher Reiseführer-Assistent. 
Gib detaillierte, interessante und nützliche Informationen über Orte und Sehenswürdigkeiten auf Deutsch.
Erzähle mir über ${location}...`;
```

**After**:
```typescript
import i18n from '../config/i18n';

const lang = i18n.language || 'de';

const scoringPrompts = {
  de: `Du bist ein Reise-Experte. Bewerte Sehenswürdigkeiten basierend auf Benutzerinteressen.
Benutzerinteressen: ${interests.join(', ')}
Bewerte jede Sehenswürdigkeit von 1-10 basierend auf Relevanz...`,
  en: `You are a travel expert. Rate attractions based on user interests.
User interests: ${interests.join(', ')}
Rate each attraction from 1-10 based on relevance...`
};

const descriptionPrompts = {
  de: `Du bist ein hilfreicher Reiseführer-Assistent. 
Gib detaillierte, interessante und nützliche Informationen über Orte und Sehenswürdigkeiten auf Deutsch.
Erzähle mir über ${location}...`,
  en: `You are a helpful travel guide assistant.
Provide detailed, interesting and useful information about places and attractions in English.
Tell me about ${location}...`
};

const scoringPrompt = scoringPrompts[lang] || scoringPrompts.de;
const descriptionPrompt = descriptionPrompts[lang] || descriptionPrompts.de;
```

## Validation Criteria

### Pre-Merge Checklist

- [ ] All 22 new keys present in both `en` and `de` sections
- [ ] Key names follow camelCase convention
- [ ] Interpolation placeholders consistent across languages (e.g., `{{city}}`)
- [ ] Emoji characters preserved correctly (📍, 🔍, 💡)
- [ ] Punctuation matches original strings (periods, colons, etc.)
- [ ] No hardcoded German strings remain in screens (verify with grep)
- [ ] German comments replaced with English equivalents
- [ ] All tests pass with updated i18n keys

### Automated Validation

```bash
# Verify no hardcoded German strings remain
grep -rn "Keine\|keine\|Fehler\|Modus\|Suchen\|verfügbar" src/screens/ | grep -v ".test.tsx"
# Expected: 0 matches (excluding test files)

# Verify no German comments remain
grep -rn "\/\/ .*[äöüÄÖÜß]" src/
# Expected: 0 matches

# Verify translation parity
# Manual: Count keys in resources.en.translation and resources.de.translation
# Expected: Equal counts
```

## Breaking Changes

**None**. This is an additive change. Existing translation keys remain unchanged. New keys are added to support previously hardcoded strings.

## Backward Compatibility

All existing i18n functionality continues to work. Components already using `t()` function are unaffected. Only components with hardcoded strings are updated to use the translation system.

---

**Contract Status**: ✅ Complete  
**Total Keys**: 22 new (across 2 languages = 44 total new translation entries)  
**Affected Files**: 6 screens + 1 service + 1 config file
