---

description: "Task list for Complete Internationalization feature"
---

# Tasks: Complete Internationalization

**Input**: Design documents from `/specs/002-complete-i18n/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/i18n-keys.md

**Tests**: Tests are NOT explicitly requested in the feature specification. This is a refactoring feature focused on extracting hardcoded text. Existing tests will be updated to work with i18n keys, but no new test files are created.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Mobile (single-project React Native): `src/`, `__tests__/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and translation key setup

- [X] T001 Review contracts/i18n-keys.md to understand all 22 translation keys
- [X] T002 Add 22 new translation keys to src/config/i18n.ts (both 'de' and 'en' sections)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core i18n configuration that MUST be complete before screen modifications

**⚠️ CRITICAL**: No screen modifications can begin until translation keys are in place

- [X] T003 Verify translation key parity (equal count in de/en sections) in src/config/i18n.ts
- [X] T004 Test i18n configuration loads correctly by starting app with `npm start`

**Checkpoint**: i18n configuration ready - screen implementation can now begin in parallel

---

## Phase 3: User Story 1 - Extract Hardcoded German Text to i18n (Priority: P1) 🎯 MVP

**Goal**: Extract all hardcoded German strings from screens and services to translation system, enabling proper multi-language support

**Independent Test**: Switch language to English in Settings, navigate through all screens - verify all UI text displays in English (no hardcoded German visible)

### Implementation for User Story 1

#### Screen Modifications (can run in parallel)

- [X] T005 [P] [US1] Update HomeScreen to use i18n in src/screens/HomeScreen.tsx
  - Import useTranslation hook
  - Replace 'GPS-Modus' with t('gpsMode')
  - Replace 'Manuelle Suche' with t('manualSearch')
  - Replace placeholder with t('enterLocationPlaceholder')
  - Replace 'Suchen' with t('searchButton')
  - Replace Alert errors with t('errorTitle'), t('locationNotFoundError'), t('locationSearchError'), t('routePlannerError')

- [X] T006 [P] [US1] Update DetailsScreen to use i18n in src/screens/DetailsScreen.tsx
  - Import useTranslation hook
  - Replace 'Keine Informationen verfügbar' with t('noInformationAvailable')
  - Replace 'Keine Wikipedia-Daten für diesen Ort verfügbar' with t('noWikipediaData')
  - Replace 'Keine personalisierten Informationen verfügbar' with t('noPersonalizedInfo')
  - Replace 'Für dich interessant' with t('interestingForYou')
  - Replace 'Quelle: Wikipedia' with t('sourceWikipedia')
  - Replace 'Personalisierte Beschreibung' with t('personalizedDescription')

- [X] T007 [P] [US1] Update MapScreen to use i18n in src/screens/MapScreen.tsx
  - Import useTranslation hook
  - Replace 'Standort abrufen' with t('getLocation')
  - Replace 'Erneut versuchen' with t('retryButton')
  - Replace '💡 Kartenansicht ist nur in der mobilen App verfügbar' with t('mapOnlyMobileApp')
  - Replace Alert 'Fehler' with t('errorTitle'), t('navigationError')

- [X] T008 [P] [US1] Update FavoritesScreen to use i18n in src/screens/FavoritesScreen.tsx
  - Import useTranslation hook
  - Replace 'Keine Favoriten gespeichert' with t('noFavoritesSaved')

- [X] T009 [P] [US1] Update SettingsScreen to use i18n in src/screens/SettingsScreen.tsx
  - Import useTranslation hook
  - Replace 'Meine Interessen' with t('myInterests')
  - Replace 'Wähle deine Interessen aus...' with t('selectInterestsPrompt')

#### Test Updates (can run in parallel with screen modifications)

- [X] T010 [P] [US1] Update HomeScreen tests in __tests__/screens/HomeScreen.test.tsx
  - Verify test assertions check for translation keys (not hardcoded German text)
  - Update mocks if needed to return keys for testing

- [X] T011 [P] [US1] Update DetailsScreen tests in __tests__/screens/DetailsScreen.test.tsx
  - Verify test assertions check for translation keys
  - Update mocks if needed

- [X] T012 [P] [US1] Update MapScreen tests in __tests__/screens/MapScreen.test.tsx
  - Verify test assertions check for translation keys
  - Update mocks if needed

- [X] T013 [P] [US1] Update FavoritesScreen tests in __tests__/screens/FavoritesScreen.test.tsx
  - Verify test assertions check for translation keys
  - Update mocks if needed

- [X] T014 [P] [US1] Update SettingsScreen tests in __tests__/screens/SettingsScreen.test.tsx
  - Verify test assertions check for translation keys
  - Update mocks if needed

#### Validation

- [X] T015 [US1] Run automated validation for User Story 1
  - Execute: `grep -rn "Keine\|keine\|Fehler\|Modus\|Suchen\|verfügbar" src/screens/ | grep -v ".test.tsx"`
  - Expected: 0 matches (no hardcoded German in screens)
  - Run: `npm test`
  - Expected: All 270 tests pass

**Checkpoint**: At this point, all hardcoded German text should be extracted to i18n system and language switching should work correctly

---

## Phase 4: User Story 2 - Replace Non-English Code Comments with English (Priority: P2)

**Goal**: Replace all German code comments with English equivalents for international developer accessibility

**Independent Test**: Search codebase for German comments using `grep -rn "\/\/ .*[äöüÄÖÜß]" src/` - verify zero matches

### Implementation for User Story 2

- [X] T016 [P] [US2] Replace German comment in src/screens/DetailsScreen.tsx line 72
  - Change: `// Wenn keine Wikipedia-Daten vorhanden, zeige "Für dich interessant"`
  - To: `// If no Wikipedia data available, show "Interesting for you"`

- [X] T017 [P] [US2] Replace console log in src/screens/WebViewScreen.tsx
  - Change: `console.log('Wikitravel nicht gefunden, trying Wikipedia')`
  - To: `console.log('Wikitravel not found, trying Wikipedia')`

- [X] T018 [P] [US2] Search for additional German comments across src/ directory
  - Execute: `grep -rn "\/\/ .*\(Wenn\|für\|über\|nicht\|verfügbar\)" src/`
  - Replace any found comments with English equivalents

#### Validation

- [X] T019 [US2] Run automated validation for User Story 2
  - Execute: `grep -rn "\/\/ .*[äöüÄÖÜß]" src/`
  - Expected: 0 matches (no German comments)
  - Verify: Code review confirms all comments are in English

**Checkpoint**: At this point, all code comments should be in English, accessible to international developers

---

## Phase 5: User Story 3 - Ensure AI/LLM Prompts Support User Language Preference (Priority: P3)

**Goal**: Adapt OpenAI service prompts to respect user's selected language preference (German or English)

**Independent Test**: Switch language to English, view AI-generated attraction descriptions - verify prompts request English responses

### Implementation for User Story 3

- [X] T020 [US3] Update scoreAttractionsByInterest function in src/services/openai.service.ts
  - Import i18n from '../config/i18n'
  - Access language: `const lang = i18n.language || 'de'`
  - Create German and English prompt variants
  - Select prompt based on language: `const prompt = prompts[lang] || prompts.de`

- [X] T021 [US3] Update fetchLLMDescription function in src/services/openai.service.ts
  - Import i18n from '../config/i18n'
  - Access language: `const lang = i18n.language || 'de'`
  - Create German and English prompt variants
  - Select prompt based on language: `const prompt = prompts[lang] || prompts.de`

#### Test Updates

- [X] T022 [P] [US3] Update openai.service tests in __tests__/services/openai.service.test.ts
  - Verify prompts adapt to mocked i18n.language setting
  - Test both 'de' and 'en' language scenarios

#### Validation

- [X] T023 [US3] Manual validation for User Story 3
  - Start app, set language to German
  - View AI description - verify prompt structure appropriate for German
  - Switch to English
  - View AI description - verify prompt structure appropriate for English

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and improvements across all user stories

- [X] T024 [P] Run complete test suite: `npm test`
  - Expected: All 270 tests pass
  - Expected: Test execution time < 60 seconds

- [X] T025 [P] Run test coverage check: `npm run test:coverage`
  - Expected: Coverage maintained at >80% overall
  - Expected: No coverage regressions in Services, Hooks, Utils

- [X] T026 Verify language switching end-to-end
  - Start app in German
  - Navigate through all screens - verify German text
  - Switch to English in Settings
  - Navigate through all screens - verify English text
  - Switch back to German - verify German text

- [X] T027 Run all validation checks from quickstart.md
  - Grep for hardcoded German strings: 0 matches
  - Grep for German comments: 0 matches
  - All tests passing
  - Coverage thresholds met

- [X] T028 Code review and cleanup
  - Verify all 22 translation keys present in both de/en
  - Verify naming conventions followed (camelCase)
  - Verify interpolation consistent across languages
  - Remove any unused imports or code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Core feature requirement
- **User Story 2 (Phase 4)**: Can start after Foundational - Independent of User Story 1
- **User Story 3 (Phase 5)**: Can start after Foundational - Independent of User Stories 1 & 2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1 & US2

**Key Insight**: All three user stories are independent and can be worked on in parallel after Phase 2 completes.

### Within Each User Story

**User Story 1**:
- T002 (add keys) MUST complete before T005-T009 (screen modifications)
- T005-T009 (screens) can run in parallel with each other
- T010-T014 (test updates) can run in parallel with screen modifications
- T015 (validation) runs after all screen and test updates

**User Story 2**:
- T016-T018 (comment replacements) can run in parallel
- T019 (validation) runs after comment replacements

**User Story 3**:
- T020-T021 (service updates) can run sequentially (same file)
- T022 (test update) can run in parallel with service updates
- T023 (validation) runs after service updates

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001 and T002 run sequentially (review then implement)

**Phase 2 (Foundational)**:
- T003 and T004 run sequentially (verify then test)

**Phase 3 (User Story 1) - Maximum Parallelism**:
```bash
# All screen modifications in parallel:
T005 (HomeScreen) | T006 (DetailsScreen) | T007 (MapScreen) | T008 (FavoritesScreen) | T009 (SettingsScreen)

# All test updates in parallel (can overlap with screen modifications):
T010 (HomeScreen tests) | T011 (DetailsScreen tests) | T012 (MapScreen tests) | T013 (FavoritesScreen tests) | T014 (SettingsScreen tests)
```

**Phase 4 (User Story 2) - Parallel Comments**:
```bash
T016 (DetailsScreen comment) | T017 (WebViewScreen log) | T018 (Additional search)
```

**Phase 5 (User Story 3)**:
- T020 and T021 sequential (same file)
- T022 can run in parallel with T020-T021

**Phase 6 (Polish)**:
- T024 and T025 can run in parallel
- T026-T028 run sequentially (validation depends on all changes)

**Cross-Story Parallelism**:
After Phase 2 completes, all three user stories can proceed in parallel:
- Team Member A: Phase 3 (User Story 1)
- Team Member B: Phase 4 (User Story 2)
- Team Member C: Phase 5 (User Story 3)

---

## Parallel Example: Maximum Concurrency

```bash
# After Phase 2 completes, launch all independent work:

# User Story 1 - Screen modifications (5 tasks in parallel):
Task T005: "Update HomeScreen to use i18n in src/screens/HomeScreen.tsx"
Task T006: "Update DetailsScreen to use i18n in src/screens/DetailsScreen.tsx"
Task T007: "Update MapScreen to use i18n in src/screens/MapScreen.tsx"
Task T008: "Update FavoritesScreen to use i18n in src/screens/FavoritesScreen.tsx"
Task T009: "Update SettingsScreen to use i18n in src/screens/SettingsScreen.tsx"

# User Story 1 - Test updates (5 tasks in parallel, can overlap with screens):
Task T010: "Update HomeScreen tests in __tests__/screens/HomeScreen.test.tsx"
Task T011: "Update DetailsScreen tests in __tests__/screens/DetailsScreen.test.tsx"
Task T012: "Update MapScreen tests in __tests__/screens/MapScreen.test.tsx"
Task T013: "Update FavoritesScreen tests in __tests__/screens/FavoritesScreen.test.tsx"
Task T014: "Update SettingsScreen tests in __tests__/screens/SettingsScreen.test.tsx"

# User Story 2 - Comment replacements (3 tasks in parallel):
Task T016: "Replace German comment in src/screens/DetailsScreen.tsx line 72"
Task T017: "Replace console log in src/screens/WebViewScreen.tsx"
Task T018: "Search for additional German comments across src/"

# User Story 3 - Service updates (2 tasks sequential, but can run parallel to US1/US2):
Task T020: "Update scoreAttractionsByInterest function in src/services/openai.service.ts"
Task T021: "Update fetchLLMDescription function in src/services/openai.service.ts"
```

**Maximum parallelism**: 13 tasks can run simultaneously after Phase 2 (5 screens + 5 tests + 3 comments)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002) - 20 min
2. Complete Phase 2: Foundational (T003-T004) - 10 min
3. Complete Phase 3: User Story 1 (T005-T015) - 90 min
4. **STOP and VALIDATE**: Test language switching works correctly
5. Deploy/demo if ready - **Core i18n functionality complete**

**Estimated MVP Time**: 2 hours

### Incremental Delivery

1. Complete Setup + Foundational → i18n keys ready (30 min)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - core feature working)
3. Add User Story 2 → Test independently → Deploy/Demo (code quality improvement)
4. Add User Story 3 → Test independently → Deploy/Demo (AI language support)
5. Each story adds value without breaking previous stories

**Total Estimated Time**: 2-3 hours for all stories

### Parallel Team Strategy

With multiple developers (after Phase 2 completes):

1. **Team completes Setup + Foundational together** (30 min)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (90 min) - 5 screens + 5 test files
   - Developer B: User Story 2 (20 min) - Comment replacements
   - Developer C: User Story 3 (30 min) - OpenAI service adaptation
3. **Stories complete and integrate independently**
4. **Final validation together** (Phase 6 - 30 min)

**Total Parallel Time**: ~2 hours with 3 developers

### Single Developer Sequential Strategy

1. Phase 1: Setup (20 min)
2. Phase 2: Foundational (10 min)
3. Phase 3: User Story 1 (90 min)
   - Do screens sequentially: T005 → T006 → T007 → T008 → T009
   - Then test updates: T010 → T011 → T012 → T013 → T014
   - Validate: T015
4. Phase 4: User Story 2 (20 min)
5. Phase 5: User Story 3 (30 min)
6. Phase 6: Polish (30 min)

**Total Sequential Time**: ~3 hours

---

## Task Summary

**Total Tasks**: 28
- Phase 1 (Setup): 2 tasks
- Phase 2 (Foundational): 2 tasks
- Phase 3 (User Story 1): 11 tasks (5 screens + 5 tests + 1 validation)
- Phase 4 (User Story 2): 4 tasks (3 implementations + 1 validation)
- Phase 5 (User Story 3): 4 tasks (2 service updates + 1 test + 1 validation)
- Phase 6 (Polish): 5 tasks

**Parallelizable Tasks**: 20 tasks marked [P]
**User Story Breakdown**:
- US1: 11 tasks (core i18n extraction)
- US2: 4 tasks (comment translation)
- US3: 4 tasks (AI language support)

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (User Story 1) → Phase 6 = ~2.5 hours

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3)
- Each user story is independently completable and testable
- No new test files created (this is a refactoring feature)
- Existing tests updated to work with i18n keys instead of hardcoded text
- All changes are additive and non-breaking
- Commit after each logical group of tasks
- Stop at any checkpoint to validate story independently
- Constitutional Principle VI: All tests MUST pass before completion
