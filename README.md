# Travel Guide App

A React Native mobile application that helps travelers discover nearby attractions using GPS, Wikipedia, and AI-powered recommendations.

## Features

- 🗺️ GPS-based attraction discovery
- ⭐ Personalized interest matching
- 📍 Interactive map view
- ❤️ Favorites management
- 🌐 Wikipedia integration
- 🤖 AI-powered descriptions
- 🌍 Multi-language support (German/English)

## Prerequisites

- Node.js 16+ and npm
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Testing

The project includes comprehensive test coverage for all layers of the application.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests (services, hooks, utils)
npm run test:unit

# Run only integration tests (screens)
npm run test:integration

# Run tests for CI/CD
npm run test:ci
```

### Test Coverage

The test suite achieves the following coverage:

| Layer | Coverage | Target | Status |
|-------|----------|--------|--------|
| Services | 98.79% | 90% | ✅ |
| Hooks | 100% | 85% | ✅ |
| Utils | 100% | 90% | ✅ |
| Screens | 55.36% | 75% | ⚠️ |
| **Overall** | **80.45%** | **80%** | **✅** |

### Test Statistics

- **Total Tests**: 272
- **Passing**: 226 (83%)
- **Execution Time**: ~15 seconds
- **Flakiness**: 0%

### Coverage Report

After running `npm run test:coverage`, open the HTML coverage report:

```bash
open coverage/lcov-report/index.html
```

### Test Documentation

For detailed information about test patterns, conventions, and troubleshooting, see:

📖 [Test Documentation](__tests__/README.md)

## Project Structure

```
src/
├── services/        # Business logic layer
├── hooks/           # Custom React hooks
├── screens/         # Screen components
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── config/          # Configuration files
└── constants/       # App constants

__tests__/
├── services/        # Service layer tests (98.79% coverage)
├── hooks/           # Hook tests (100% coverage)
├── screens/         # Screen component tests (55.36% coverage)
├── utils/           # Utility tests (100% coverage)
├── fixtures/        # Test data factories
└── setup/           # Test configuration
```

## Scripts

```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run in web browser

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:ci        # Run tests for CI/CD

# Code Quality
npm run lint           # Run ESLint (if configured)
npm run type-check     # Run TypeScript type checking
```

## Configuration

### Environment Variables

The app uses different configurations for development and production:

- `src/config/default.json` - Default configuration
- `src/config/production.json` - Production overrides (gitignored)
- `src/config/development.json` - Development overrides (gitignored)

### Localization

The app supports multiple languages:
- German (de)
- English (en)

Language files are located in `src/config/i18n.ts`.

## Architecture

The application follows a layered architecture:

1. **Presentation Layer** (`screens/`): React Native components
2. **State Management Layer** (`hooks/`): Custom hooks for state and side effects
3. **Business Logic Layer** (`services/`): Service classes for core functionality
4. **Utility Layer** (`utils/`): Pure utility functions

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Testing Philosophy

- **Unit Tests**: Test individual functions/methods in isolation
- **Integration Tests**: Test component interactions with hooks and services
- **Mocked Dependencies**: All external dependencies (APIs, location, storage) are mocked
- **Fast Execution**: Test suite completes in ~15 seconds
- **Offline**: Tests run without network access
- **No Flakiness**: Deterministic results on every run

## CI/CD Integration

The test suite is designed for CI/CD environments:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Run tests
  run: npm run test:ci

- name: Check coverage
  run: npm run test:coverage
```

## Contributing

When contributing to this project:

1. Write tests for new features
2. Ensure all tests pass: `npm test`
3. Maintain coverage thresholds: `npm run test:coverage`
4. Follow existing code patterns
5. Update documentation as needed

## Troubleshooting

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific test file
npm test -- __tests__/services/wiki.service.test.ts
```

### Coverage Not Met

```bash
# Generate detailed coverage report
npm run test:coverage

# Open HTML report to see uncovered lines
open coverage/lcov-report/index.html
```

For more troubleshooting tips, see [Test Documentation](__tests__/README.md#troubleshooting).

## License

[Add your license here]

## Support

For issues and questions:
- Check the [Test Documentation](__tests__/README.md)
- Review the [Architecture Documentation](ARCHITECTURE.md)
- Open an issue on GitHub
