# Quickstart: Complete Internationalization

**Feature**: 002-complete-i18n  
**Branch**: `002-complete-i18n`  
**Date**: 2025-12-11

## Overview

Extract all hardcoded German text to i18n translation system, replace German code comments with English, and adapt AI service prompts to respect user language preference. This is a **refactoring feature** with no new functionality - only improving internationalization support.

**Complexity**: Low - Using existing i18n infrastructure, additive changes only  
**Estimated Effort**: 2-3 hours  
**Risk Level**: Low - All changes testable, tests currently passing

## Prerequisites

- Branch `002-complete-i18n` already created and checked out
- All 270 tests currently passing (verified 2025-12-11)
- Existing i18n system functional (react-i18next 14.0.0)

## Implementation Steps

### Step 1: Add Translation Keys to i18n Config (20 min)

**File**: `src/config/i18n.ts`

**Action**: Add 22 new translation keys to both English and German sections.

**Reference**: See [contracts/i18n-keys.md](./contracts/i18n-keys.md) for complete key list.

**Categories to add**:
- Empty States (5 keys)
- Mode Labels (2 keys)
- Action Buttons (3 keys)
- Input Placeholders (1 key)
- AI Labels (4 keys)
- Prompts (2 keys)
- Error Messages (5 keys)

**Validation**: Ensure key count matches between `resources.en.translation` and `resources.de.translation`.

---

### Step 2: Update Screen Components (60 min)

**Files to modify** (in order of priority):
1. `src/screens/HomeScreen.tsx` - 5 hardcoded strings
2. `src/screens/DetailsScreen.tsx` - 6 hardcoded strings + 1 German comment
3. `src/screens/MapScreen.tsx` - 3 hardcoded strings
4. `src/screens/FavoritesScreen.tsx` - 1 hardcoded string
5. `src/screens/SettingsScreen.tsx` - 2 hardcoded strings
6. `src/screens/WebViewScreen.tsx` - 1 console log

**Pattern for each screen**:

```typescript
// 1. Import useTranslation at top
import { useTranslation } from 'react-i18next';

// 2. Inside component, get t function
const { t } = useTranslation();

// 3. Replace hardcoded strings with t('key')
// BEFORE:
<Text>Keine Favoriten gespeichert</Text>

// AFTER:
<Text>{t('noFavoritesSaved')}</Text>

// 4. For Alert.alert with hardcoded text:
// BEFORE:
Alert.alert('Fehler', 'Ort nicht gefunden');

// AFTER:
Alert.alert(t('errorTitle'), t('locationNotFoundError'));
```

**Specific replacements** (see contracts/i18n-keys.md for complete mappings):

**HomeScreen.tsx**:
- `'📍 GPS-Modus'` → `t('gpsMode')`
- `'🔍 Manuelle Suche'` → `t('manualSearch')`
- `'Ort eingeben (z.B. Bad Doberan)'` → `t('enterLocationPlaceholder')`
- `'Suchen'` → `t('searchButton')`
- Alert messages → `t('errorTitle')`, `t('locationNotFoundError')`, etc.

**DetailsScreen.tsx**:
- `'Keine Informationen verfügbar.'` → `t('noInformationAvailable')`
- `'Keine Wikipedia-Daten für diesen Ort verfügbar.'` → `t('noWikipediaData')`
- `'Keine personalisierten Informationen verfügbar.'` → `t('noPersonalizedInfo')`
- `'Für dich interessant'` → `t('interestingForYou')`
- `'Quelle: Wikipedia'` → `t('sourceWikipedia')`
- `'Personalisierte Beschreibung'` → `t('personalizedDescription')`
- German comment line 72 → English: `// If no Wikipedia data available, show "Interesting for you"`

**MapScreen.tsx**:
- `'Standort abrufen'` → `t('getLocation')`
- `'Erneut versuchen'` → `t('retryButton')`
- `'💡 Kartenansicht ist nur in der mobilen App verfügbar'` → `t('mapOnlyMobileApp')`
- Alert → `t('errorTitle')`, `t('navigationError')`

**FavoritesScreen.tsx**:
- `'Keine Favoriten gespeichert'` → `t('noFavoritesSaved')`

**SettingsScreen.tsx**:
- `'Meine Interessen'` → `t('myInterests')`
- `'Wähle deine Interessen aus...'` → `t('selectInterestsPrompt')`

**WebViewScreen.tsx**:
- Console log: `'Wikitravel nicht gefunden, trying Wikipedia'` → `'Wikitravel not found, trying Wikipedia'`

---

### Step 3: Update OpenAI Service for Language-Aware Prompts (20 min)

**File**: `src/services/openai.service.ts`

**Action**: Adapt AI prompts to use language from i18n context.

**Implementation**:

```typescript
import i18n from '../config/i18n';

// At the start of each function that generates prompts:
const lang = i18n.language || 'de';

// For scoreAttractionsByInterest function:
const scoringPrompts = {
  de: `Du bist ein Reise-Experte. Bewerte Sehenswürdigkeiten basierend auf Benutzerinteressen.
Benutzerinteressen: ${interests.join(', ')}
Bewerte jede Sehenswürdigkeit von 1-10 basierend auf Relevanz zu diesen Interessen.

Sehenswürdigkeiten:
${attractions.map((a: any, i: number) => 
  `${i + 1}. ${a.name} (${a.types?.join(', ') || 'Verschiedenes'})`
).join('\n')}

Antworte NUR mit einer JSON-Liste von Scores: [score1, score2, ...]`,
  en: `You are a travel expert. Rate attractions based on user interests.
User interests: ${interests.join(', ')}
Rate each attraction from 1-10 based on relevance to these interests.

Attractions:
${attractions.map((a: any, i: number) => 
  `${i + 1}. ${a.name} (${a.types?.join(', ') || 'Various'})`
).join('\n')}

Respond ONLY with a JSON list of scores: [score1, score2, ...]`
};

const prompt = scoringPrompts[lang] || scoringPrompts.de;

// For fetchLLMDescription function:
const descriptionPrompts = {
  de: `Du bist ein hilfreicher Reiseführer-Assistent. Gib detaillierte, interessante und nützliche Informationen über Orte und Sehenswürdigkeiten auf Deutsch.

Erzähle mir über ${location}. Gib Informationen über Geschichte, Sehenswürdigkeiten, kulturelle Bedeutung und interessante Fakten. Halte die Antwort informativ aber prägnant (ca. 200-300 Wörter).`,
  en: `You are a helpful travel guide assistant. Provide detailed, interesting and useful information about places and attractions in English.

Tell me about ${location}. Provide information about history, attractions, cultural significance and interesting facts. Keep the response informative but concise (approx. 200-300 words).`
};

const prompt = descriptionPrompts[lang] || descriptionPrompts.de;
```

**Validation**: Test by switching language in Settings and viewing AI-generated descriptions.

---

### Step 4: Update Test Mocks (20 min)

**Files potentially needing updates**:
- `__tests__/screens/*.test.tsx`
- `__tests__/setup/mocks.ts`

**Current i18n mock** (in jest.setup.ts or mocks.ts):
```typescript
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Returns key itself
    i18n: { 
      changeLanguage: jest.fn(),
      language: 'de'
    }
  })
}));
```

**Action**: 
- Verify mock returns key names (not translated text)
- Update test assertions to check for keys instead of hardcoded German text

**Example test update**:
```typescript
// BEFORE:
expect(screen.getByText('Keine Favoriten gespeichert')).toBeTruthy();

// AFTER:
expect(screen.getByText('noFavoritesSaved')).toBeTruthy();
// OR better - test semantic meaning:
expect(screen.getByText(t('noFavoritesSaved'))).toBeTruthy();
```

**Test Strategy**: Most tests should continue working if mock returns keys. May need to update specific text assertions.

---

### Step 5: Validate Implementation (20 min)

**Automated Validation**:

```bash
# 1. Check for remaining hardcoded German strings
grep -rn "Keine\|keine\|Fehler\|Modus\|Suchen\|verfügbar" src/screens/ | grep -v ".test.tsx"
# Expected: 0 matches

# 2. Check for German comments
grep -rn "\/\/ .*[äöüÄÖÜß]" src/
# Expected: 0 matches

# 3. Run all tests
npm test
# Expected: All 270 tests pass

# 4. Check test coverage
npm run test:coverage
# Expected: Coverage maintained at >80%
```

**Manual Validation**:
1. Start app: `npm start`
2. Verify German mode displays German text
3. Switch to English in Settings
4. Navigate through all screens - verify English text displays
5. Check AI descriptions request appropriate language
6. Verify no hardcoded German visible in UI

---

## Success Criteria Checklist

- [ ] All 22 translation keys added to i18n.ts (both de and en)
- [ ] Zero hardcoded German strings in src/screens/ (verified by grep)
- [ ] Zero German comments in src/ (verified by grep)
- [ ] All 6 screens use t() function for user-facing text
- [ ] OpenAI service adapts prompts to i18n.language
- [ ] All 270 tests pass
- [ ] Language switching works correctly (German ↔ English)
- [ ] Code review confirms i18n patterns used correctly

## Testing Checklist

**Functional Testing**:
- [ ] Language switch in Settings immediately updates UI
- [ ] All screens display correct language after switch
- [ ] AI descriptions respect language preference
- [ ] Alerts and error messages use correct language
- [ ] Empty states show translated text

**Regression Testing**:
- [ ] All existing features work unchanged
- [ ] No visual layout issues from text length changes
- [ ] Performance unchanged (translation lookup < 1ms)

**Automated Testing**:
- [ ] `npm test` passes all tests
- [ ] `npm run test:coverage` meets thresholds
- [ ] No test flakiness observed

## Rollback Plan

If issues discovered post-implementation:

1. **Git revert**: `git revert HEAD` (reverts last commit)
2. **Branch switch**: `git checkout 001-add-tests` (return to stable branch)
3. **Review changes**: Identify specific breaking change
4. **Fix forward**: Create fix commit addressing issue

**Low Risk**: All changes are additive (new keys) or substitution (hardcoded → t()). No breaking changes to existing i18n functionality.

## Common Issues & Solutions

**Issue**: Tests fail with "Cannot find key" error  
**Solution**: Ensure mock returns key names, not translations. Check jest.setup.ts mock implementation.

**Issue**: Language switching doesn't update some screens  
**Solution**: Verify `useTranslation()` hook used in component. React re-renders on language change.

**Issue**: AI prompts still in German despite English setting  
**Solution**: Verify `i18n.language` accessed correctly. Check fallback logic.

**Issue**: Text truncated or layout broken  
**Solution**: English text may be longer/shorter than German. Adjust styles if needed (rare).

## Next Steps After Completion

1. Create PR from `002-complete-i18n` to `001-add-tests`
2. Request code review focusing on:
   - Translation key completeness
   - No hardcoded strings remain
   - Test coverage maintained
3. Verify CI pipeline passes all checks
4. Merge to main branch
5. Update documentation if needed

---

**Quick Reference**:
- **Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Translation Keys**: [contracts/i18n-keys.md](./contracts/i18n-keys.md)
- **Plan**: [plan.md](./plan.md)

**Estimated Total Time**: 2-3 hours  
**Complexity**: Low  
**Risk**: Low  
**Impact**: High (Constitutional Principle V compliance)
