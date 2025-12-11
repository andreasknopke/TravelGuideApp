# Research: Complete Internationalization

**Feature**: 002-complete-i18n  
**Date**: 2025-12-11  
**Status**: Complete

## Research Questions

### Q1: How should translation keys be named for extracted hardcoded strings?

**Decision**: Use semantic, hierarchical naming with camelCase convention

**Rationale**:
- Existing i18n.ts already uses flat camelCase keys (e.g., `appName`, `selectLanguage`, `nearbyAttractions`)
- Semantic names are more maintainable than positional names (e.g., `noFavoritesSaved` better than `favorites.emptyMessage`)
- Flat structure acceptable for 50 keys; hierarchical nesting only needed at larger scale (100+ keys)
- React-i18next supports both flat and nested keys, but flat is simpler for this scope

**Key Naming Pattern**:
```typescript
// Empty states
noFavoritesSaved
noInformationAvailable
noWikipediaData
noPersonalizedInfo

// Mode labels
gpsMode
manualSearch

// Actions
searchButton
retryButton
getLocation

// Errors (alerts)
errorTitle
locationNotFound
locationSearchError
navigationError

// AI/Personalization
interestingForYou
sourceWikipedia
personalizedDescription
myInterests
selectInterestsPrompt

// Placeholders
enterLocationPlaceholder
```

**Alternatives Considered**:
- **Nested structure** (e.g., `screens.favorites.empty`) - Rejected: Overkill for current scale, inconsistent with existing flat keys
- **Component-prefixed** (e.g., `FavoritesScreen_empty`) - Rejected: Couples translations to implementation details
- **snake_case** - Rejected: Inconsistent with existing camelCase convention

---

### Q2: How should dynamic text with interpolation be handled in i18n?

**Decision**: Use i18next interpolation with {{variable}} syntax

**Rationale**:
- i18next natively supports interpolation: `t('key', { variable: value })`
- Existing codebase doesn't currently use interpolation, but library supports it
- Examples from feature: "Mehr über {city} erfahren" → `t('learnMoreAbout', { city })`
- Template syntax: `{{variable}}` in translation strings

**Implementation Pattern**:
```typescript
// Translation file
de: {
  learnMoreAbout: 'Mehr über {{city}} erfahren',
  mapNotAvailableWeb: '💡 Kartenansicht ist nur in der mobilen App verfügbar'
}

en: {
  learnMoreAbout: 'Learn more about {{city}}',
  mapNotAvailableWeb: '💡 Map view is only available in mobile app'
}

// Component usage
const text = t('learnMoreAbout', { city: 'Bad Doberan' });
```

**Alternatives Considered**:
- **String concatenation** - Rejected: Doesn't support word order differences across languages
- **React node interpolation** - Rejected: Unnecessarily complex for simple text substitution

---

### Q3: How should AI service prompts adapt to user language preference?

**Decision**: Access `i18n.language` in openai.service.ts and construct language-specific prompts

**Rationale**:
- `i18n.language` is globally accessible singleton returning current language code ('de' or 'en')
- OpenAI API accepts prompts in any language; specifying language in prompt improves response quality
- Prompt structure should explicitly request responses in user's language
- Fallback to German (default) if language detection fails

**Implementation Pattern**:
```typescript
import i18n from '../config/i18n';

export const scoreAttractionsByInterest = async (attractions, interests) => {
  const lang = i18n.language || 'de';
  
  const prompts = {
    de: `Du bist ein Reise-Experte. Bewerte Sehenswürdigkeiten basierend auf Benutzerinteressen...`,
    en: `You are a travel expert. Rate attractions based on user interests...`
  };
  
  const prompt = prompts[lang] || prompts.de;
  // ... rest of implementation
};
```

**Edge Cases Handled**:
- Missing language: Fallback to German (primary language)
- Unsupported language: Use German (only de/en supported currently)
- Language switching: Next API call uses new language automatically

**Alternatives Considered**:
- **Always use English prompts** - Rejected: May reduce quality for German-speaking users
- **Detect language from response** - Rejected: Too late, prompt already sent
- **Multi-language prompts** - Rejected: Confuses the AI model

---

### Q4: What is the best practice for handling missing translation keys?

**Decision**: Use i18next's built-in fallback behavior with `returnNull: false`

**Rationale**:
- i18next default behavior: Returns key itself when translation missing
- Current configuration already has proper fallback: `fallbackLng: 'de'`
- Development mode can show warnings for missing keys via `debug: true`
- Production should fail gracefully by showing key (helps identify issues without breaking UI)

**Current Configuration** (from src/config/i18n.ts):
```typescript
i18n.use(initReactI18next).init({
  resources,
  lng: 'de', // default language
  fallbackLng: 'de', // fallback to German
  interpolation: {
    escapeValue: false // React already escapes
  }
});
```

**No Changes Needed**: Existing configuration handles missing keys appropriately.

**Alternatives Considered**:
- **Throw errors on missing keys** - Rejected: Would crash app
- **Return empty string** - Rejected: Harder to debug missing translations
- **Return English fallback** - Rejected: Current fallbackLng: 'de' is appropriate for primary language

---

### Q5: How should German code comments be identified systematically?

**Decision**: Use grep search with German keyword patterns, then manual review

**Rationale**:
- German comments use specific patterns: "Wenn", "für", "verfügbar", "nicht", etc.
- Automated search provides initial candidates
- Manual review required to distinguish German comments from German strings in tests/translations
- Small codebase (6 screens, 1 service) makes manual review feasible

**Identification Strategy**:
```bash
# Search for common German words in comments
grep -rn "\/\/ .*\(Wenn\|für\|über\|nicht\|verfügbar\)" src/

# Or use VS Code search with regex:
\/\/.*[äöüÄÖÜß]
```

**Known German Comments** (from earlier analysis):
- DetailsScreen.tsx line 72: `// Wenn keine Wikipedia-Daten vorhanden, zeige "Für dich interessant"`

**Translation**:
```typescript
// OLD: // Wenn keine Wikipedia-Daten vorhanden, zeige "Für dich interessant"
// NEW: // If no Wikipedia data available, show "Interesting for you"
```

**Alternatives Considered**:
- **Automated translation tool** - Rejected: Risk of poor translation quality for technical comments
- **Remove all comments** - Rejected: Loses valuable documentation
- **Leave as-is** - Rejected: Violates spec requirement and international developer accessibility

---

## Best Practices Applied

### React-i18next Best Practices

1. **Use `useTranslation` hook in components**:
```typescript
const { t } = useTranslation();
return <Text>{t('key')}</Text>;
```

2. **Avoid prop drilling**: Each component gets its own `useTranslation()` instance
3. **Lazy loading**: Not needed for small translation files (<50 keys)
4. **Type safety**: Consider adding TypeScript types for translation keys (future enhancement)

### Testing i18n Components

1. **Mock i18n in tests** (already implemented):
```typescript
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));
```

2. **Test key usage, not translated text**: Assertions should check `t('key')` was called, not specific German/English text
3. **Test language switching**: Verify `changeLanguage` triggers re-render with new translations

### i18n File Organization

**Current Structure** (maintain):
```typescript
const resources = {
  en: { translation: { ...keys } },
  de: { translation: { ...keys } }
};
```

**Add new keys alphabetically** within existing structure to maintain readability.

---

## Technology Choices

### Primary Libraries

- **i18next (23.7.0)**: Industry-standard i18n framework, extensive ecosystem
- **react-i18next (14.0.0)**: React bindings for i18next with hooks support
- **No additional dependencies needed**: Existing setup handles all requirements

### Why No Additional Tools Needed

- ✅ Translation management: Files small enough for manual management
- ✅ Type checking: TypeScript strict mode catches undefined variables
- ✅ Pluralization: Not needed for current strings (all singular)
- ✅ Date/time formatting: Handled by native JavaScript Intl API (not in scope)

---

## Implementation Risks

### Low Risk
- Breaking existing i18n: Infrastructure already proven, just adding keys
- Performance impact: Translation lookup is O(1) hash map access

### Medium Risk
- Test brittleness: Tests may need mock updates if assertions check translated text
  - **Mitigation**: Review test expectations, update mocks to return test-friendly strings

### Negligible Risk
- Language switching: Already working for existing keys, new keys will work identically
- Missing translations: i18next fallback behavior handles gracefully

---

## Summary

All research questions resolved. No blockers identified. Existing i18n infrastructure is robust and requires only additive changes (new translation keys). Implementation approach:

1. Extract hardcoded strings to new translation keys in `i18n.ts`
2. Replace hardcoded text in components with `t('key')` calls
3. Adapt OpenAI service to use language-aware prompts
4. Replace German comments with English equivalents
5. Update test mocks as needed (minimal changes expected)

**Estimated Complexity**: Low - Refactoring existing code using established patterns, no new architecture or dependencies.
