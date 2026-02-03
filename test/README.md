# Test Suite

This directory contains the comprehensive test suite for the icsorg project.

## Test Structure

```
test/
├── unit/                          # Unit tests for individual functions
│   ├── parseAttendee.test.js     # Tests for attendee parsing
│   ├── parseDuration.test.js     # Tests for duration formatting
│   ├── makeTimestamp.test.js     # Tests for timestamp creation
│   ├── makeTimestampRange.test.js # Tests for timestamp ranges
│   ├── makeMailtoLink.test.js    # Tests for email link formatting
│   └── getPropertyValue.test.js  # Tests for ICS property extraction
├── integration/                   # Integration tests
│   └── getIcsData.test.js        # Tests for file/URL reading
└── fixtures/                      # Test data files
    └── sample.ics                # Sample ICS file for testing
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:watch
```

## Test Statistics

- **Total Tests**: 59
- **Unit Tests**: 52
- **Integration Tests**: 7
- **Test Coverage**: Core functions (parseAttendee, parseDuration, makeTimestamp, makeMailtoLink, getPropertyValue, getIcsData)

## Test Framework

- **Test Runner**: Mocha
- **Assertion Library**: Chai (expect style)
- **Test Type**: ES6 Modules

## Writing New Tests

### Unit Test Template

```javascript
import { expect } from "chai";
import { functionName } from "../../src/lib.js";

describe("functionName", () => {
  it("should do something", () => {
    const result = functionName(input);
    expect(result).to.equal(expected);
  });
});
```

### Integration Test Template

```javascript
import { expect } from "chai";
import { functionName } from "../../src/lib.js";

describe("functionName (Integration)", () => {
  it("should work with real data", async () => {
    const result = await functionName(realInput);
    expect(result).to.include(expectedContent);
  });
});
```

## Test Fixtures

The `fixtures/` directory contains sample data files for testing:

- **sample.ics**: A valid ICS file with 3 test events
  - Event with multiple attendees
  - Event with descriptions and locations
  - All-day event

## Adding New Fixtures

1. Create a new `.ics` file in `test/fixtures/`
2. Ensure it's valid ICS format
3. Reference it in tests using relative paths

Example:

```javascript
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
```

## Test Best Practices

1. **Keep tests focused**: Each test should verify one thing
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Test edge cases**: Include null, undefined, empty strings, etc.
4. **Mock when necessary**: Use mock objects for complex dependencies
5. **Keep tests independent**: Tests should not depend on each other
6. **Clean up after tests**: Reset state if needed

## Continuous Integration

Tests are designed to be run in CI/CD pipelines. All tests must pass before merging changes.
