# ICSORG Technical Specification

This document provides detailed technical specifications for implementing the identified improvements.

## 1. Bug Fixes

### 1.1 parseAttendee Parameter Fix

**Current Issue:**
The `parseAttendee` function call incorrectly passes `author` and `email` parameters outside the mapping function:

```javascript
attendees: e.attendees.map((a) => parseAttendee(a.jCal[1]), author, email);
```

**Root Cause:**
JavaScript's `map` function signature is `array.map(callback, thisArg)`. The extra parameters are being passed as `thisArg` instead of to the `parseAttendee` function.

**Solution:**
Move the parameters inside the arrow function call:

```javascript
attendees: e.attendees.map((a) => parseAttendee(a.jCal[1], author, email));
```

### 1.2 parseDuration Typo Fix

**Current Issue:**
The `parseDuration` function has a typo where `d.minutes` should be used but `d.hours` is used twice:

```javascript
return `${d.weeks} wk ${d.days} d ${pad(d.hours)}:${pad(d.hours)} hh:mm`;
```

**Root Cause:**
Copy-paste error or typo during implementation.

**Solution:**
Correct the second parameter to use `d.minutes`:

```javascript
return `${d.weeks} wk ${d.days} d ${pad(d.hours)}:${pad(d.minutes)} hh:mm`;
```

## 2. Refactoring Details

### 2.1 Configuration Management Extraction

**Current State:**
Configuration parsing is embedded within the `main()` function, making it lengthy and harder to maintain.

**Proposed Solution:**
Extract configuration management into a separate function:

```javascript
/**
 * Parse and validate configuration settings
 *
 * @param {Object} argv - Command line arguments
 * @returns {Object} validated configuration object
 */
function parseConfig(argv) {
  // Configuration parsing logic here
}
```

### 2.2 Parameter Validation

**Current State:**
No validation for required parameters like `ICS_FILE` and `ORG_FILE`.

**Proposed Solution:**
Add validation function:

```javascript
/**
 * Validate required configuration parameters
 *
 * @param {Object} config - Configuration object
 * @throws {Error} if required parameters are missing
 */
function validateConfig(config) {
  if (!config.ICS_FILE) {
    throw new Error("Missing required ICS_FILE parameter");
  }
  if (!config.ORG_FILE) {
    throw new Error("Missing required ORG_FILE parameter");
  }
}
```

## 3. Testing Strategy

### 3.1 Unit Tests

**Test Framework:** Mocha with Chai assertions (already in dependencies)

**Test Structure:**

```
test/
├── unit/
│   ├── parseAttendee.test.js
│   ├── parseDuration.test.js
│   ├── makeTimestamp.test.js
│   ├── makeMailtoLink.test.js
│   └── getPropertyValue.test.js
└── integration/
    └── workflow.test.js
```

### 3.2 Test Examples

**parseAttendee.test.js:**

```javascript
import { expect } from "chai";
import { parseAttendee } from "../src/index.js";

describe("parseAttendee", () => {
  it("should correctly parse attendee data", () => {
    const testData = {
      category: "test",
      role: "REQ-PARTICIPANT",
      partstat: "ACCEPTED",
      cn: "test@example.com",
    };

    const result = parseAttendee(testData, "Test User", "test@example.com");

    expect(result).to.deep.equal({
      category: "test",
      role: "REQ-PARTICIPANT",
      status: "ACCEPTED",
      cn: "test@example.com",
      guests: undefined,
      me: true,
    });
  });
});
```

## 4. Error Handling Improvements

### 4.1 Enhanced Error Messages

**Current:**

```javascript
throw new Error(`getIcsData: ${err.message}`);
```

**Improved:**

```javascript
throw new Error(
  `getIcsData: Failed to retrieve ICS data from ${source}. ${err.message}`,
);
```

## 5. Code Quality Enhancements

### 5.1 JSDoc Coverage

All functions should have complete JSDoc documentation including:

- Description
- Parameters with types
- Return values with types
- Async indicators where appropriate

Example:

```javascript
/**
 * Parse an attendee array to generate an attendee object
 *
 * @param {Object} data - Array of data about an attendee
 * @param {string} author - Author's name - used to identify 'me' attendee
 * @param {string} email - Email address - used to identify 'me' attendee
 *
 * @returns {Object} with properties for category, role, status, cn, guests and me
 */
function parseAttendee(data, author, email) {
  // implementation
}
```

## 6. Implementation Checklist

### Phase 1: Critical Bug Fixes

- [ ] Fix parseAttendee parameter passing
- [ ] Fix parseDuration typo
- [ ] Verify fixes with unit tests

### Phase 2: Refactoring

- [ ] Extract configuration management
- [ ] Add parameter validation
- [ ] Improve error handling

### Phase 3: Testing

- [ ] Implement unit tests for all functions
- [ ] Create integration tests
- [ ] Set up test execution scripts

### Phase 4: Documentation

- [ ] Add missing JSDoc comments
- [ ] Update README with testing information
- [ ] Create developer documentation
