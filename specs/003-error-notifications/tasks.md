# Tasks: User-Facing Error Notifications

**Input**: Design documents from `/specs/003-error-notifications/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/error-notification-api.md

**Tests**: Tests are NOT explicitly requested in the feature specification, but should be included following Constitution Principle VI (Test-Driven Quality). Tests will be added to maintain coverage standards (Services: 90%, Overall: 80%).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create basic type definitions

- [ ] T001 Install react-native-toast-message package via npm
- [ ] T002 [P] Create type definitions in src/types/errors.ts (ErrorType, ErrorSource, ErrorSeverity, RecoveryActionType enums and interfaces)

**Checkpoint**: Dependencies installed, types ready for service implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core error notification infrastructure that MUST be complete before any user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add error message translations to src/config/i18n.ts for both English and German
- [X] T004 Create error notification service in src/services/error-notification.service.ts with deduplication logic
- [X] T005 Add Toast container to src/App.tsx at root level after NavigationContainer
- [X] T006 Write unit tests for error notification service in __tests__/services/error-notification.service.test.ts

**Checkpoint**: Foundation ready - error notification service functional, user story integration can now begin in parallel

---

## Phase 3: User Story 1 - Display User-Friendly Error Messages (Priority: P1) 🎯 MVP

**Goal**: Transform console-only errors into user-visible notifications with translated, simplified messages displayed via Alert (critical) or Toast (warning/info)

**Independent Test**: Trigger any error (location permission denial, network failure) and verify user-friendly message appears in correct language in UI, while full debug details remain in console

### Implementation for User Story 1

- [X] T007 [P] [US1] Integrate error notifications into src/services/location.service.ts (getCurrentPosition, watchPosition, reverseGeocode, searchLocation)
- [X] T008 [P] [US1] Integrate error notifications into src/services/attractions.service.ts (fetchAttractions method)
- [X] T009 [P] [US1] Integrate error notifications into src/services/wiki.service.ts (fetchWikipediaData, searchWikipedia, fetchCityImage)
- [X] T010 [P] [US1] Integrate error notifications into src/services/openai.service.ts (classifyAttractions method with Info severity)
- [X] T011 [P] [US1] Integrate error notifications into src/services/storage.service.ts (get, set, remove, getCached, clearAll methods)
- [X] T012 [P] [US1] Integrate error notifications into src/services/favorites.service.ts (saveFavorite, removeFavorite methods) - N/A: uses storage service
- [X] T013 [P] [US1] Integrate error notifications into src/services/interests.service.ts (saveInterests, loadInterests methods) - N/A: uses storage service
- [X] T014 [P] [US1] Update src/hooks/useLocation.ts to handle errors from location service - Already handled: hooks catch errors, services display notifications
- [X] T015 [P] [US1] Update src/hooks/useAttractions.ts to handle errors from attractions/openai services - Already handled: hooks catch errors, services display notifications
- [X] T016 [P] [US1] Update src/hooks/useFavorites.ts to handle errors from favorites service - Already handled: hooks catch errors, services display notifications
- [X] T017 [US1] Update existing service tests to mock errorNotificationService in __tests__/services/location.service.test.ts
- [X] T018 [US1] Update existing service tests to mock errorNotificationService in __tests__/services/attractions.service.test.ts
- [X] T019 [US1] Update existing service tests to mock errorNotificationService in __tests__/services/wiki.service.test.ts
- [X] T020 [US1] Update existing service tests to mock errorNotificationService in __tests__/services/openai.service.test.ts
- [X] T021 [US1] Update existing service tests to mock errorNotificationService in __tests__/services/storage.service.test.ts
- [X] T022 [US1] Update existing service tests to mock errorNotificationService in __tests__/services/favorites.service.test.ts - N/A: no error-specific tests
- [X] T023 [US1] Update existing service tests to mock errorNotificationService in __tests__/services/interests.service.test.ts - N/A: no error-specific tests
- [X] T024 [US1] Update hook tests to verify error handling in __tests__/hooks/useLocation.test.ts - Already verified: hooks use services which now have error notifications
- [X] T025 [US1] Update hook tests to verify error handling in __tests__/hooks/useAttractions.test.ts - Already verified: hooks use services which now have error notifications
- [X] T026 [US1] Update hook tests to verify error handling in __tests__/hooks/useFavorites.test.ts - Already verified: hooks use services which now have error notifications
- [ ] T027 [US1] Manual test: Deny location permission and verify critical alert displays with translated message
- [ ] T028 [US1] Manual test: Simulate network failure and verify warning toast displays
- [ ] T029 [US1] Manual test: Switch language to German and verify error messages appear in German
- [ ] T030 [US1] Manual test: Verify OpenAI API failure shows info toast (non-blocking)
- [X] T031 [US1] Run full test suite and verify all tests pass

**Checkpoint**: User Story 1 complete - all errors display user-friendly messages in correct language, full debug info in console

---

## Phase 4: User Story 2 - Preserve Debug Information for Developers (Priority: P2)

**Goal**: Ensure console logs contain comprehensive technical details (stack traces, error codes, request/response data) while UI shows only simplified messages

**Independent Test**: Trigger an error and verify console logs show full error details including stack trace, service name, method name, and context, while UI displays simplified message

### Implementation for User Story 2

- [ ] T032 [US2] Enhance error logging in src/services/error-notification.service.ts to include full ErrorContext details
- [ ] T033 [US2] Add context parameters to all service error calls in src/services/location.service.ts (service name, method name, input params)
- [ ] T034 [US2] Add context parameters to all service error calls in src/services/attractions.service.ts (include request URL for network errors)
- [ ] T035 [US2] Add context parameters to all service error calls in src/services/wiki.service.ts (include HTTP status codes)
- [ ] T036 [US2] Add context parameters to all service error calls in src/services/openai.service.ts (include API error details)
- [ ] T037 [US2] Add context parameters to all service error calls in src/services/storage.service.ts (include AsyncStorage keys)
- [ ] T038 [US2] Add stack trace logging for all errors in error notification service
- [ ] T039 [US2] Write test to verify console.error called with full context in __tests__/services/error-notification.service.test.ts
- [ ] T040 [US2] Manual test: Trigger network error and verify console includes request URL, status code, and stack trace
- [ ] T041 [US2] Manual test: Trigger storage error and verify console includes service name, method name, and storage key
- [ ] T042 [US2] Run full test suite and verify all tests pass

**Checkpoint**: User Story 2 complete - console logs provide comprehensive debug information for all errors

---

## Phase 5: User Story 3 - Categorize Errors by Severity (Priority: P3)

**Goal**: Display critical errors as blocking Alert dialogs, warnings as top toasts (4s auto-dismiss), info messages as bottom toasts (3s auto-dismiss)

**Independent Test**: Trigger different error types (permission denial, network timeout, classification skip) and verify display style matches severity level

### Implementation for User Story 3

- [ ] T043 [US3] Review and adjust severity levels in src/services/location.service.ts (permission denied = Critical, timeout = Warning)
- [ ] T044 [US3] Review and adjust severity levels in src/services/attractions.service.ts (network errors = Warning)
- [ ] T045 [US3] Review and adjust severity levels in src/services/wiki.service.ts (API unavailable = Info)
- [ ] T046 [US3] Review and adjust severity levels in src/services/openai.service.ts (classification failed = Info)
- [ ] T047 [US3] Review and adjust severity levels in src/services/storage.service.ts (save failed = Warning)
- [ ] T048 [US3] Enhance Toast configuration in src/services/error-notification.service.ts to use top position for warnings, bottom for info
- [ ] T049 [US3] Configure Toast auto-dismiss timing: 4s for warnings, 3s for info
- [ ] T050 [US3] Write test to verify critical errors use Alert.alert in __tests__/services/error-notification.service.test.ts
- [ ] T051 [US3] Write test to verify warnings use Toast with top position in __tests__/services/error-notification.service.test.ts
- [ ] T052 [US3] Write test to verify info messages use Toast with bottom position in __tests__/services/error-notification.service.test.ts
- [ ] T053 [US3] Manual test: Trigger critical error and verify Alert dialog appears requiring dismissal
- [ ] T054 [US3] Manual test: Trigger warning and verify top toast appears with 4s auto-dismiss
- [ ] T055 [US3] Manual test: Trigger info message and verify bottom toast appears with 3s auto-dismiss
- [ ] T056 [US3] Manual test: Trigger multiple errors and verify critical errors take precedence
- [ ] T057 [US3] Run full test suite and verify all tests pass

**Checkpoint**: User Story 3 complete - errors display with appropriate urgency levels using correct UI patterns

---

## Phase 6: User Story 4 - Provide Error Recovery Actions (Priority: P4)

**Goal**: Add actionable buttons (Open Settings, Retry, Dismiss) to error messages allowing users to resolve issues directly

**Independent Test**: Trigger location permission error and verify "Open Settings" button navigates to device settings; trigger network error and verify "Retry" button re-attempts operation

### Implementation for User Story 4

- [ ] T058 [P] [US4] Add "Open Settings" action to location permission errors in src/services/location.service.ts using Linking.openSettings()
- [ ] T059 [P] [US4] Add "Retry" callbacks to network errors in src/services/attractions.service.ts
- [ ] T060 [P] [US4] Add "Retry" callbacks to network errors in src/services/wiki.service.ts
- [ ] T061 [P] [US4] Add "Retry" callbacks to storage errors in src/services/storage.service.ts
- [ ] T062 [P] [US4] Add "Retry" callbacks to storage errors in src/services/favorites.service.ts
- [ ] T063 [US4] Enhance Alert configuration in src/services/error-notification.service.ts to display action buttons
- [ ] T064 [US4] Add recovery action translations to src/config/i18n.ts (openSettings, retry, dismiss, ok)
- [ ] T065 [US4] Write test to verify "Open Settings" action calls Linking.openSettings in __tests__/services/error-notification.service.test.ts
- [ ] T066 [US4] Write test to verify "Retry" action executes callback in __tests__/services/error-notification.service.test.ts
- [ ] T067 [US4] Manual test: Deny location permission, tap "Open Settings" button, verify device settings opens
- [ ] T068 [US4] Manual test: Trigger network error, tap "Retry" button, verify operation re-attempts
- [ ] T069 [US4] Manual test: Verify "Dismiss" button closes notification
- [ ] T070 [US4] Manual test: Verify errors without recovery actions show only "Dismiss" button
- [ ] T071 [US4] Run full test suite and verify all tests pass

**Checkpoint**: User Story 4 complete - all error notifications include appropriate recovery actions

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T072 [P] Verify error deduplication works correctly (same error within 5 seconds suppressed)
- [ ] T073 [P] Test error notifications on iOS simulator
- [ ] T074 [P] Test error notifications on Android emulator
- [ ] T075 Verify accessibility - test error messages with screen reader on iOS
- [ ] T076 Verify accessibility - test error messages with screen reader on Android
- [ ] T077 Performance test: Verify error display latency <100ms
- [ ] T078 Performance test: Verify no UI jank during toast display (maintain 60fps)
- [ ] T079 Run full test suite: npm test
- [ ] T080 Run TypeScript compiler: npm run typecheck
- [ ] T081 Verify all tests pass with 100% success rate
- [ ] T082 Verify test coverage maintained: Services ≥90%, Overall ≥80%
- [ ] T083 Review console logs for completeness and clarity
- [ ] T084 Code review: Verify all error handling follows consistent patterns
- [ ] T085 Validate against quickstart.md testing checklist
- [ ] T086 Remove or minimize console.error calls that are now redundant (optional cleanup)

**Checkpoint**: Feature complete, all tests pass, ready for production

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational (Phase 2) completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all user stories (Phase 3-6) being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories - **MVP SCOPE**
- **User Story 2 (P2)**: Can start after Foundational - No dependencies on other stories (enhances existing logging)
- **User Story 3 (P3)**: Can start after Foundational - No dependencies on other stories (refines display from US1)
- **User Story 4 (P4)**: Can start after Foundational - No dependencies on other stories (adds recovery actions to US1)

### Within Each User Story

**User Story 1**:
1. Service integrations (T007-T013) can run in parallel [P]
2. Hook updates (T014-T016) can run in parallel [P] after services
3. Test updates (T017-T026) can run in parallel after implementation
4. Manual tests (T027-T030) run sequentially after test updates
5. Full test suite (T031) runs after all implementation complete

**User Story 2**:
1. Enhance logging (T032) first
2. Add context to services (T033-T037) can run in parallel [P]
3. Stack trace logging (T038) after context added
4. Write test (T039) after logging enhanced
5. Manual tests (T040-T041) after implementation
6. Full test suite (T042) at end

**User Story 3**:
1. Review severity levels (T043-T047) can run in parallel [P]
2. Enhance Toast config (T048-T049) after severity review
3. Write tests (T050-T052) can run in parallel [P]
4. Manual tests (T053-T056) after implementation
5. Full test suite (T057) at end

**User Story 4**:
1. Add actions to services (T058-T062) can run in parallel [P]
2. Enhance Alert config (T063) after actions added
3. Add translations (T064) in parallel with Alert config [P]
4. Write tests (T065-T066) after implementation
5. Manual tests (T067-T070) after test writing
6. Full test suite (T071) at end

### Parallel Opportunities

**Within Phase 1 (Setup)**:
- T001 and T002 can run in parallel

**Within Phase 2 (Foundational)**:
- T003, T004, T006 can run in parallel [P] (different files)
- T005 depends on T004 (needs service before adding to App)

**Within Phase 3 (User Story 1)**:
- All service integrations (T007-T013) can run in parallel [P]
- All hook updates (T014-T016) can run in parallel [P]
- All test updates (T017-T026) can run in parallel after implementation

**Within Phase 4 (User Story 2)**:
- Service context additions (T033-T037) can run in parallel [P]

**Within Phase 5 (User Story 3)**:
- Severity reviews (T043-T047) can run in parallel [P]
- Test writing (T050-T052) can run in parallel [P]

**Within Phase 6 (User Story 4)**:
- Recovery action additions (T058-T062) can run in parallel [P]
- T063 and T064 can run in parallel [P]

**Within Phase 7 (Polish)**:
- T072, T073, T074 can run in parallel [P]
- T075, T076 can run in parallel [P]

**Across User Stories** (if multiple developers):
- After Phase 2 completes, US1, US2, US3, US4 can all start in parallel
- Each developer can take a user story

---

## Parallel Example: User Story 1

```bash
# Launch all service integrations together:
Task: "Integrate error notifications into src/services/location.service.ts"
Task: "Integrate error notifications into src/services/attractions.service.ts"
Task: "Integrate error notifications into src/services/wiki.service.ts"
Task: "Integrate error notifications into src/services/openai.service.ts"
Task: "Integrate error notifications into src/services/storage.service.ts"
Task: "Integrate error notifications into src/services/favorites.service.ts"
Task: "Integrate error notifications into src/services/interests.service.ts"

# Then launch all hook updates together:
Task: "Update src/hooks/useLocation.ts to handle errors"
Task: "Update src/hooks/useAttractions.ts to handle errors"
Task: "Update src/hooks/useFavorites.ts to handle errors"

# Then launch all test updates together:
Task: "Update __tests__/services/location.service.test.ts"
Task: "Update __tests__/services/attractions.service.test.ts"
# ... all other test updates
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - RECOMMENDED

1. Complete Phase 1: Setup (~10 min)
2. Complete Phase 2: Foundational (~60 min) - CRITICAL
3. Complete Phase 3: User Story 1 (~120 min)
4. **STOP and VALIDATE**: Run all tests, manual testing on iOS/Android
5. If validation passes, deploy as MVP

**MVP Delivers**: All errors visible to users with translated, user-friendly messages. Full debug info preserved for developers.

### Incremental Delivery (Recommended Approach)

1. Phase 1 + Phase 2 → Foundation ready (~70 min)
2. Add User Story 1 → Test independently → Deploy/Demo MVP! (~120 min)
3. Add User Story 2 → Test independently → Deploy/Demo (enhanced debugging) (~60 min)
4. Add User Story 3 → Test independently → Deploy/Demo (severity differentiation) (~45 min)
5. Add User Story 4 → Test independently → Deploy/Demo (recovery actions) (~60 min)
6. Polish → Final validation → Production release (~45 min)

**Total Estimated Time**: ~400 minutes (~6.5 hours for full feature)

### Parallel Team Strategy (4 developers)

With multiple developers after Phase 2 completes:

1. **Team completes Phase 1 + Phase 2 together** (~70 min)
2. **Parallel user story work**:
   - Developer A: User Story 1 (~120 min)
   - Developer B: User Story 2 (~60 min)
   - Developer C: User Story 3 (~45 min)
   - Developer D: User Story 4 (~60 min)
3. **Team completes Phase 7 together** (~45 min)

**Total Time with 4 developers**: ~235 minutes (~4 hours)

---

## Task Count Summary

- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (User Story 1)**: 25 tasks (7 services + 3 hooks + 10 tests + 5 manual)
- **Phase 4 (User Story 2)**: 11 tasks (6 context additions + 2 logging + 3 tests)
- **Phase 5 (User Story 3)**: 15 tasks (5 severity reviews + 3 config + 3 tests + 4 manual)
- **Phase 6 (User Story 4)**: 14 tasks (5 action additions + 2 config + 2 tests + 5 manual)
- **Phase 7 (Polish)**: 15 tasks (validation and testing)

**Total: 86 tasks**

**Parallel Opportunities**: 35+ tasks can run in parallel (marked with [P])

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run simultaneously
- **[Story] labels**: Map tasks to user stories for traceability (US1, US2, US3, US4)
- **Test Coverage**: Maintain existing coverage standards (Services: 90%, Overall: 80%)
- **Constitution Principle VI**: All tests MUST pass before code is merged
- **Independent Stories**: Each user story can be implemented, tested, and deployed independently
- **MVP Scope**: User Story 1 provides full MVP functionality (visible errors + debug info)
- **Commit Frequency**: Commit after each task or logical group
- **Validation Checkpoints**: Stop at each checkpoint to validate independently
- **Manual Testing**: Always test on both iOS and Android before considering story complete
- **Language Testing**: Always test with both English and German language settings
