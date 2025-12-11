# Implementation Plan: Complete Internationalization

**Branch**: `002-complete-i18n` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-complete-i18n/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Extract all hardcoded German text from screens and services to i18n translation system, replace German code comments with English, and adapt AI service prompts to respect user language preference. This addresses Constitutional Principle V (Internationalization) violation and ensures proper multi-language support. Technical approach uses existing react-i18next infrastructure with systematic extraction of 40+ hardcoded strings across 6 screens.

## Technical Context

**Language/Version**: TypeScript 5.3 with React Native 0.81.5  
**Primary Dependencies**: react-i18next 14.0.0, i18next 23.7.0, React Navigation 6.x  
**Storage**: AsyncStorage for favorites/settings, no additional storage needed for i18n  
**Testing**: Jest 29.7.0 with React Native Testing Library 12.9.0  
**Target Platform**: iOS 13+ and Android 8.0+ (API 26+) via Expo 54.x  
**Project Type**: Mobile (cross-platform React Native)  
**Performance Goals**: No impact to 60fps UI rendering, translation lookup <1ms  
**Constraints**: Offline-first (translations bundled), maintain existing test coverage (270 tests passing)  
**Scale/Scope**: 6 screens, 40+ hardcoded strings, 2 languages (de/en), ~50 new translation keys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User-First Experience
✅ **PASS** - Extracting hardcoded text improves UX by enabling proper language switching. Users selecting English will now see fully translated UI instead of mixed German/English content.

### Principle II: Cross-Platform Consistency
✅ **PASS** - i18n system works identically on iOS and Android. No platform-specific changes required.

### Principle III: Offline-First Architecture
✅ **PASS** - Translation files are bundled with app, no network dependency. Offline functionality maintained.

### Principle IV: API Integration Standards
✅ **PASS** - OpenAI service adaptation to use user language preference maintains service isolation. No new API integrations.

### Principle V: Internationalization (i18n)
✅ **PASS** - This feature directly addresses current i18n violations. Extracts all hardcoded German text to translation system, fully aligning with this principle.

### Principle VI: Test-Driven Quality
✅ **PASS** - All 270 existing tests currently passing. Test updates will maintain assertions while adapting to i18n keys. No new functional behavior requiring new tests (text externalization only).

**Pre-Implementation Gate Status**: ✅ **ALL GATES PASSED** - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-complete-i18n/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   └── i18n-keys.md     # Translation key inventory
└── checklists/
    └── requirements.md  # Spec validation checklist (completed)
```

### Source Code (repository root)

```text
src/
├── config/
│   ├── i18n.ts          # MODIFY: Add new translation keys for de/en
│   └── index.ts
├── screens/             # MODIFY: All 6 screens to use t() instead of hardcoded strings
│   ├── DetailsScreen.tsx    # 6 hardcoded strings to extract
│   ├── FavoritesScreen.tsx  # 1 hardcoded string to extract
│   ├── HomeScreen.tsx       # 5 hardcoded strings + alerts to extract
│   ├── MapScreen.tsx        # 3 hardcoded strings to extract
│   ├── SettingsScreen.tsx   # 2 hardcoded strings to extract
│   └── WebViewScreen.tsx    # 1 console log to convert to English
├── services/
│   └── openai.service.ts    # MODIFY: Dynamic prompts based on i18n.language
└── types/
    └── index.ts

__tests__/
├── screens/             # UPDATE: Adapt mocks to work with i18n keys
│   ├── DetailsScreen.test.tsx
│   ├── FavoritesScreen.test.tsx
│   ├── HomeScreen.test.tsx
│   ├── MapScreen.test.tsx
│   └── SettingsScreen.test.tsx
└── setup/
    └── mocks.ts         # UPDATE: Ensure i18n mock returns appropriate test strings
```

**Structure Decision**: Mobile (single-project) structure. All source in `src/`, tests in `__tests__/`. Feature impacts 6 screen components, 1 service, and 1 configuration file. No new directories or architectural changes needed - this is a refactoring/cleanup feature using existing infrastructure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified**. All constitutional principles are satisfied:
- ✅ Principle I-VI all passed
- ✅ No new dependencies
- ✅ No architecture changes
- ✅ Maintains test coverage

This section left empty per template instructions (no violations to justify).

---

## Phase 0: Research (Complete)

**Output**: [research.md](./research.md)

**Research Questions Resolved**:
1. Translation key naming conventions (camelCase, semantic)
2. Dynamic text interpolation patterns (i18next {{variable}} syntax)
3. AI prompt language adaptation (access i18n.language in service)
4. Missing translation key handling (existing fallback behavior sufficient)
5. German comment identification strategy (grep + manual review)

**Best Practices Applied**:
- React-i18next hooks usage (`useTranslation()`)
- Test mocking strategies for i18n
- Translation file organization (flat structure for <100 keys)

**Technology Choices**:
- Existing i18next 23.7.0 + react-i18next 14.0.0 (no new dependencies)
- No additional tools needed (manual translation management)

**Estimated Complexity**: Low - Refactoring with established patterns

---

## Phase 1: Design & Contracts (Complete)

### Data Model

**Output**: [data-model.md](./data-model.md)

**Entities Defined**:
1. **Translation Key** - Unique identifier for translatable strings
2. **Translation Value** - Localized text for specific language
3. **Language Context** - User's current language preference
4. **AI Prompt Template** - Language-specific prompts for OpenAI

**Key Inventory**: 22 new translation keys across 7 categories
- Empty States (5)
- Mode Labels (2)
- Action Buttons (3)
- Input Placeholders (1)
- AI Labels (4)
- Prompts (2)
- Error Messages (5)

**Data Consistency Rules**:
- Translation parity (all keys in both de/en)
- Interpolation consistency (same placeholders across languages)
- Key naming consistency (camelCase, semantic)

### Contracts

**Output**: [contracts/i18n-keys.md](./contracts/i18n-keys.md)

**Contract Specifications**:
- Complete translation key inventory with de/en values
- Component usage examples (before/after)
- Validation criteria (grep checks, test requirements)
- Breaking changes assessment (none - additive only)

**Implementation Format**:
- i18n.ts structure with all keys
- Component migration patterns
- OpenAI service prompt adaptation

### Quickstart

**Output**: [quickstart.md](./quickstart.md)

**Implementation Guide**:
- 5-step implementation plan (2-3 hour estimate)
- Step-by-step instructions with code examples
- Validation checklist (automated + manual)
- Success criteria verification
- Rollback plan
- Common issues & solutions

**Testing Strategy**:
- Functional testing checklist
- Regression testing requirements
- Automated test validation

### Agent Context Update

**Output**: Updated `.github/agents/copilot-instructions.md`

**Changes Applied**:
- Added TypeScript 5.3 with React Native 0.81.5
- Added react-i18next 14.0.0, i18next 23.7.0, React Navigation 6.x
- Added AsyncStorage context
- Confirmed Mobile (cross-platform React Native) project type

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion*

### Principle I: User-First Experience
✅ **PASS** - Design preserves all UX. Translation lookup <1ms, no performance impact. Language switching provides immediate feedback.

### Principle II: Cross-Platform Consistency
✅ **PASS** - Design uses platform-agnostic i18next. Works identically on iOS and Android.

### Principle III: Offline-First Architecture
✅ **PASS** - All translations bundled with app. Zero network dependency. Offline operation fully maintained.

### Principle IV: API Integration Standards
✅ **PASS** - OpenAI service maintains isolation. Language adaptation via i18n.language accessor. No API changes.

### Principle V: Internationalization (i18n)
✅ **PASS** - Design fully resolves i18n violations. 22 new keys systematically extract all hardcoded German text. Post-implementation: zero hardcoded strings.

### Principle VI: Test-Driven Quality
✅ **PASS** - Design maintains test coverage. Test updates non-breaking (mock returns keys, assertions adapt). All 270 tests expected to pass post-implementation.

**Post-Design Gate Status**: ✅ **ALL GATES PASSED** - Ready for Phase 2 (Tasks)

**Constitution Compliance**: FULL ✅  
**Violations**: None  
**Justifications Required**: None

---

## Implementation Readiness

**Status**: ✅ **READY FOR /speckit.tasks**

**Artifacts Generated**:
- ✅ plan.md (this file)
- ✅ research.md (5 research questions resolved)
- ✅ data-model.md (4 entities, 22-key inventory)
- ✅ contracts/i18n-keys.md (complete API contract)
- ✅ quickstart.md (step-by-step guide)
- ✅ Agent context updated (copilot-instructions.md)

**Pre-Implementation Validation**:
- ✅ All NEEDS CLARIFICATION resolved
- ✅ Constitution gates passed (pre and post-design)
- ✅ Technical approach validated (existing i18n infrastructure)
- ✅ No blockers identified
- ✅ Test strategy defined
- ✅ Rollback plan established

**Next Phase**: Execute `/speckit.tasks` to generate implementation task breakdown

---

## Summary

**Feature**: Complete Internationalization (002-complete-i18n)  
**Complexity**: Low (refactoring with established patterns)  
**Risk**: Low (additive changes, all testable)  
**Estimated Effort**: 2-3 hours  
**Impact**: High (Constitutional Principle V compliance)

**Approach**: Extract 22 hardcoded German strings to i18n translation system across 6 screens and 1 service. Replace German code comments with English equivalents. Adapt AI prompts to respect user language preference. Zero new dependencies, zero architecture changes, maintains all 270 passing tests.

**Ready**: Yes - proceed to task breakdown with `/speckit.tasks`
