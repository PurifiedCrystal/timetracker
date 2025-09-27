# Tasks: Multi-Language Support with Automatic Translation

**Input**: Design documents from `/specs/008-i-also-want/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 14.2.33, TypeScript, React-i18next, LibreTranslate
   → Structure: Web application (frontend + backend API routes)
2. Load design documents:
   → data-model.md: 5 entities (Translation Files, Language Config, Detection Result, User Preference, Loading State)
   → contracts/: 2 API contracts (language-detection, translation-management)
   → research.md: 7 technical decisions (IP geolocation, LibreTranslate, file structure, React integration)
   → quickstart.md: 7 test scenarios for validation
3. Generate tasks by category:
   → Setup: Dependencies (react-i18next), locales directories, configuration
   → Tests: 2 contract tests, 7 integration tests from quickstart scenarios
   → Core: 5 entities/models, 4 services, 2 API endpoints
   → Integration: Language context, UI components, cache management
   → Polish: Translation generation, performance validation, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: Frontend and backend in same Next.js project
- Frontend: `src/app/`, `src/components/`, `src/lib/`
- Backend: `src/app/api/`
- Tests: `tests/contract/`, `tests/integration/`
- Static files: `public/locales/`

## Phase 3.1: Setup & Dependencies

- [x] T001 Install i18n dependencies: react-i18next, i18next-http-backend, i18next-browser-languagedetector
- [x] T002 Create translation file directory structure in public/locales/{en,es,fr,de,it}
- [x] T003 Configure Next.js for static file serving of translation files
- [x] T004 [P] Create base English translation files in public/locales/en/ (common.json, dashboard.json, auth.json, settings.json, time.json, export.json)
- [x] T005 [P] Set up i18next configuration in src/lib/i18n.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T006 [P] Contract test POST /api/v1/language/detect in tests/contract/test_language_detection_api.ts
- [ ] T007 [P] Contract test GET /api/v1/language/supported in tests/contract/test_language_supported_api.ts
- [ ] T008 [P] Contract test POST /api/v1/language/preference in tests/contract/test_language_preference_api.ts
- [ ] T009 [P] Contract test GET /api/v1/translations/{language} in tests/contract/test_translation_management_api.ts

### Integration Tests from Quickstart Scenarios
- [ ] T010 [P] Integration test automatic language detection via geolocation in tests/integration/test_geolocation_detection.ts
- [ ] T011 [P] Integration test browser language fallback detection in tests/integration/test_browser_fallback.ts
- [ ] T012 [P] Integration test manual language switching in tests/integration/test_manual_switching.ts
- [ ] T013 [P] Integration test translation file loading and caching in tests/integration/test_translation_loading.ts
- [ ] T014 [P] Integration test incomplete translation handling in tests/integration/test_incomplete_translations.ts
- [ ] T015 [P] Integration test date and number localization in tests/integration/test_localization.ts
- [ ] T016 [P] Integration test performance requirements in tests/integration/test_performance.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Type Definitions and Models
- [x] T017 [P] Language configuration types in src/lib/types/language-config.ts
- [x] T018 [P] Translation file types in src/lib/types/translation.ts
- [x] T019 [P] Language detection types in src/lib/types/detection.ts
- [x] T020 [P] User preference types in src/lib/types/preference.ts
- [x] T021 [P] Translation loading state types in src/lib/types/loading-state.ts

### Core Services
- [x] T022 [P] Geolocation service with IP detection in src/lib/services/geolocation.ts
- [x] T023 [P] Language detection service with priority fallback in src/lib/services/language-detection.ts
- [x] T024 [P] Translation loader service with caching in src/lib/services/translation-loader.ts
- [x] T025 [P] LibreTranslate service for automated generation in src/lib/services/libre-translate.ts

### Core Configuration
- [x] T026 Language constants and country mapping in src/lib/constants/languages.ts
- [x] T027 Main i18n configuration and initialization in src/lib/i18n.ts

## Phase 3.4: API Implementation

- [x] T028 Language detection API endpoint in src/app/api/v1/language/detect/route.ts
- [x] T029 Supported languages API endpoint in src/app/api/v1/language/supported/route.ts
- [ ] T030 Language preference API endpoints in src/app/api/v1/language/preference/route.ts
- [ ] T031 Translation management API endpoints in src/app/api/v1/translations/[language]/route.ts

## Phase 3.5: Translation Generation

- [x] T032 [P] Spanish translation files in public/locales/es/ (all namespaces)
- [x] T033 [P] French translation files in public/locales/fr/ (all namespaces)
- [x] T034 [P] German translation files in public/locales/de/ (all namespaces)
- [x] T035 [P] Italian translation files in public/locales/it/ (all namespaces)
- [x] T036 Translation generation script using LibreTranslate in scripts/generate-translations.js

## Phase 3.6: UI Integration

- [x] T037 React language context provider in src/lib/contexts/LanguageContext.tsx
- [x] T038 Language switcher component in src/components/LanguageSwitcher.tsx
- [x] T039 Update root layout to include LanguageProvider in src/app/layout.tsx
- [x] T040 Add language switcher to dashboard layout in src/app/dashboard/layout.tsx

## Phase 3.7: Localization Integration

- [ ] T041 [P] Date/time formatting utilities using Intl API in src/lib/utils/date-formatting.ts
- [ ] T042 [P] Number formatting utilities using Intl API in src/lib/utils/number-formatting.ts
- [ ] T043 Update existing components to use translation hooks (dashboard, settings, auth pages)

## Phase 3.8: Caching & Performance

- [ ] T044 [P] Translation cache management with localStorage in src/lib/cache/translation-cache.ts
- [ ] T045 [P] Language preference persistence in src/lib/cache/preference-cache.ts
- [ ] T046 Implement preloading for common language alternatives
- [ ] T047 Add loading states and error boundaries for translation loading

## Phase 3.9: Error Handling & Validation

- [ ] T048 [P] Translation file validation utilities in src/lib/validation/translation-validator.ts
- [ ] T049 [P] Geolocation error handling and fallbacks in geolocation service
- [ ] T050 [P] Translation loading error recovery in translation-loader service
- [ ] T051 Missing translation fallback implementation across components

## Phase 3.10: Polish & Validation

- [ ] T052 [P] Unit tests for language configuration utilities in tests/unit/test_language_config.ts
- [ ] T053 [P] Unit tests for translation cache management in tests/unit/test_translation_cache.ts
- [ ] T054 [P] Unit tests for geolocation service in tests/unit/test_geolocation.ts
- [ ] T055 [P] Unit tests for language detection service in tests/unit/test_language_detection.ts
- [ ] T056 Performance validation: <200ms detection, <1s loading, <100ms switching
- [ ] T057 Cross-browser compatibility testing (Chrome, Firefox, Safari, Edge)
- [ ] T058 Mobile responsiveness testing for language switcher
- [ ] T059 Run quickstart.md validation scenarios end-to-end
- [ ] T060 Update documentation for i18n setup and translation workflow

## Dependencies

### Critical Dependencies (MUST follow order)
- Setup (T001-T005) before all other phases
- Tests (T006-T016) before implementation (T017-T051)
- Types (T017-T021) before services (T022-T025)
- Services (T022-T025) before API endpoints (T028-T031)
- Translation files (T032-T035) before UI integration (T037-T040)
- Core implementation before polish (T052-T060)

### File Dependencies (Same file = sequential)
- T027 (i18n.ts) after T005 (initial config)
- T037 (LanguageContext) after T027 (i18n config)
- T039 (layout.tsx) after T037 (LanguageContext)
- T043 (component updates) after T039 (LanguageProvider)

### Service Dependencies
- T023 (language-detection) requires T022 (geolocation)
- T024 (translation-loader) requires T027 (i18n config)
- T028-T031 (API endpoints) require T022-T025 (services)

## Parallel Execution Examples

### Phase 3.2 Tests (All parallel)
```
Task: "Contract test POST /api/v1/language/detect in tests/contract/test_language_detection_api.ts"
Task: "Contract test GET /api/v1/language/supported in tests/contract/test_language_supported_api.ts"
Task: "Integration test automatic language detection via geolocation in tests/integration/test_geolocation_detection.ts"
Task: "Integration test browser language fallback detection in tests/integration/test_browser_fallback.ts"
```

### Phase 3.3 Types (All parallel)
```
Task: "Language configuration types in src/lib/types/language-config.ts"
Task: "Translation file types in src/lib/types/translation.ts"
Task: "Language detection types in src/lib/types/detection.ts"
Task: "User preference types in src/lib/types/preference.ts"
```

### Phase 3.5 Translation Files (All parallel)
```
Task: "Spanish translation files in public/locales/es/ (all namespaces)"
Task: "French translation files in public/locales/fr/ (all namespaces)"
Task: "German translation files in public/locales/de/ (all namespaces)"
Task: "Italian translation files in public/locales/it/ (all namespaces)"
```

## Notes
- [P] tasks = different files, no dependencies
- All contract tests must fail before starting implementation
- Translation generation may hit LibreTranslate rate limits - implement with delays
- Cache localStorage data with expiration for performance
- Verify each quickstart scenario before marking phase complete

## Task Generation Rules Summary
*Applied during task creation*

1. **From Contracts**: 2 API contracts → 4 contract test tasks [P] + 4 API implementation tasks
2. **From Data Model**: 5 entities → 5 type definition tasks [P] + related service tasks
3. **From Quickstart**: 7 test scenarios → 7 integration test tasks [P]
4. **From Research**: 7 technical decisions → services and configuration tasks
5. **Ordering**: Setup → Tests → Types → Services → APIs → UI → Polish

## Validation Checklist
*GATE: Must pass before implementation begins*

- [x] All contracts have corresponding tests (T006-T009)
- [x] All entities have type definition tasks (T017-T021)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All quickstart scenarios have integration tests (T010-T016)
- [x] Performance requirements have validation tasks (T056)
- [x] Translation generation covers all target languages (T032-T035)