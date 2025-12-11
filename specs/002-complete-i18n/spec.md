# Feature Specification: Complete Internationalization

**Feature Branch**: `002-complete-i18n`  
**Created**: 2025-12-11  
**Status**: Draft  
**Input**: User description: "Better internationalization. Currently there is still a lot of hardcoded non-english text in the code. The goal here is to extract everything that requires translation out to i18n. Also remove all comments that contain non-english text and replace them with english comments"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extract Hardcoded German Text to i18n (Priority: P1)

Developers need all hardcoded German text extracted to i18n translation files so that the app properly supports multiple languages and maintains consistency with the existing i18n architecture. Currently, screens contain hardcoded German strings that bypass the translation system.

**Why this priority**: Hardcoded text breaks language switching functionality and violates Constitutional Principle V (Internationalization). This is the core requirement that enables proper multi-language support.

**Independent Test**: Can be tested by switching language to English and verifying all UI text changes appropriately. No German text should remain visible when English is selected.

**Acceptance Scenarios**:

1. **Given** user has app set to German, **When** viewing any screen with text, **Then** all user-facing text displays in German
2. **Given** user switches language to English in settings, **When** navigating to any screen, **Then** all previously hardcoded German text now displays in English
3. **Given** developer adds new UI text, **When** following i18n patterns, **Then** text is automatically available in both languages

---

### User Story 2 - Replace Non-English Code Comments with English (Priority: P2)

Developers need all German code comments replaced with English so that international developers can understand the codebase without language barriers and maintain consistency with standard software development practices.

**Why this priority**: Code comments are for developers, not end users. English is the standard language for code documentation in international projects. This improves maintainability but doesn't affect end-user functionality.

**Independent Test**: Can be tested by searching codebase for German comments and verifying none remain. Delivers value by making code accessible to international development teams.

**Acceptance Scenarios**:

1. **Given** developer reviews source code, **When** reading comments, **Then** all comments are in English
2. **Given** developer uses IDE code search, **When** searching for German words in comments, **Then** no results are found
3. **Given** new developer joins team, **When** reading code documentation, **Then** all inline documentation is understandable without German language knowledge

---

### User Story 3 - Ensure AI/LLM Prompts Support User Language Preference (Priority: P3)

Users need OpenAI service prompts to adapt to their selected language so that AI-generated descriptions appear in the user's preferred language (German or English).

**Why this priority**: Currently, OpenAI prompts are hardcoded in German. This should respect user's language preference for consistency, but it's lower priority because the API may return content in various languages regardless of prompt language.

**Independent Test**: Can be tested by selecting English language and viewing AI-generated descriptions. Prompts should request English responses when user language is English.

**Acceptance Scenarios**:

1. **Given** user has selected German language, **When** viewing AI-generated attraction descriptions, **Then** OpenAI is prompted to provide German responses
2. **Given** user switches to English, **When** loading new AI descriptions, **Then** OpenAI is prompted to provide English responses
3. **Given** developer reviews AI service, **When** checking prompt generation, **Then** prompts dynamically adapt to i18n language setting

---

### Edge Cases

- What happens when translation key is missing for a specific language?
- How does system handle dynamic text interpolation (e.g., "Distance: 500m")?
- What occurs when AI service returns content in unexpected language?
- How are error messages and alerts localized?
- What happens with mixed content (e.g., location names that shouldn't be translated)?
- How are pluralization rules handled for different languages?
- What occurs when date/number formatting differs between locales?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All user-facing text in screens MUST use internationalization system instead of hardcoded strings
- **FR-002**: Detail view screen MUST externalize hardcoded German strings including empty state messages, data source labels, and personalization indicators
- **FR-003**: Favorites list screen MUST externalize empty state message currently in German
- **FR-004**: Main home screen MUST externalize mode labels, search placeholders, action buttons, and error alert text currently in German
- **FR-005**: Map screen MUST externalize location action button labels currently in German
- **FR-006**: Settings screen MUST externalize interest selection headers and descriptions currently in German
- **FR-007**: Web content viewer MUST use English for developer-facing console messages
- **FR-008**: All German code comments MUST be replaced with English equivalents
- **FR-009**: AI service prompts MUST adapt to user's selected language preference
- **FR-010**: Internationalization system MUST include all new translation entries for both German and English languages
- **FR-011**: System MUST handle missing translations gracefully with fallback behavior
- **FR-012**: All existing internationalization functionality MUST continue working without regression
- **FR-013**: Translation identifiers MUST follow established naming conventions
- **FR-014**: Dynamic text with placeholders MUST use internationalization interpolation patterns
- **FR-015**: Automated tests MUST verify internationalized text is used instead of hardcoded values

### Key Entities

- **Translation Key**: Identifier for translatable text (e.g., 'noFavoritesSaved', 'gpsMode')
- **Translation Value**: Localized text for a specific language (de: "Keine Favoriten", en: "No favorites saved")
- **Language Context**: Current user language setting from i18n.language ('de' or 'en')
- **Interpolation Variables**: Dynamic values inserted into translated strings

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero hardcoded German strings remain in application screen components (verifiable by automated text search)
- **SC-002**: Zero German comments remain in source code (verifiable by code review)
- **SC-003**: All screens display correctly when user switches language from German to English
- **SC-004**: All existing automated tests pass without changes to test assertions
- **SC-005**: Text search for common German words returns zero matches in production code
- **SC-006**: AI service generates language-appropriate prompts based on user preference
- **SC-007**: Translation system contains balanced entries (equal number of keys for German and English)
- **SC-008**: Code review confirms all user-facing text uses internationalization patterns
- **SC-009**: Language switching reflects immediately across entire application
- **SC-010**: No functional regressions in existing features (all automated tests remain passing)

## Assumptions *(optional)*

- Internationalization system is already configured and working for existing translated strings
- Translation data uses structured format with hierarchical organization
- Components have access to translation functionality via established patterns
- English translations will be provided for all new entries (not machine-translated)
- Location names, attraction names, and other proper nouns should NOT be translated
- AI-generated content language depends on AI service interpretation, but prompts should request appropriate language
- Existing test infrastructure already supports internationalization testing
- Code comments are for developer audience, not end users
- German is the primary language, English is the secondary language

## Dependencies *(optional)*

- Existing internationalization library and configuration
- Current translation data structure
- AI service integration for generating localized content

## Out of Scope *(optional)*

- Adding new languages beyond German and English
- Implementing right-to-left (RTL) language support
- Translating third-party content (Wikipedia articles, API responses)
- Implementing locale-specific date/number formatting (beyond what i18n provides)
- Creating translation management tools or processes
- Adding language detection based on device settings
- Translating user-generated content
- Adding language-specific fonts or typography
- Implementing gender-neutral language variations
- Creating glossary or translation style guide
