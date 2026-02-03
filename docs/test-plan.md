# ICSORG Test Plan

This document outlines the testing strategy for the icsorg project.

## Test Framework

The project already has Mocha and Chai installed as devDependencies, so we'll use these for testing.

## Test Directory Structure

```
test/
├── unit/                 # Unit tests for individual functions
│   ├── parseAttendee.test.js
│   ├── parseDuration.test.js
│   ├── makeTimestamp.test.js
│   ├── makeMailtoLink.test.js
│   ├── getPropertyValue.test.js
│   └── utils.test.js    # Other utility function tests
├── integration/          # Integration tests
│   ├── icsData.test.js   # Tests for ICS data retrieval
│   └── orgFile.test.js   # Tests for org file creation
└── fixtures/             # Test data files
    ├── sample.ics        # Sample ICS file for testing
    └── expected.org      # Expected output for comparison
```

## Unit Test Coverage

### parseAttendee Function

- Test with valid attendee data
- Test with organizer matching author
- Test with organizer matching email
- Test with missing fields

### parseDuration Function

- Test with weeks duration
- Test with days duration
- Test with hours/minutes duration
- Test edge cases (single digit values)

### makeTimestamp Function

- Test with active timestamp type
- Test with inactive timestamp type
- Test with null/undefined input
- Test different date formats

### makeMailtoLink Function

- Test with mailto: URLs
- Test with plain email addresses
- Test with invalid input
- Test with non-email strings

### getPropertyValue Function

- Test with text properties
- Test with date-time properties
- Test with missing properties
- Test with unknown property types

## Integration Test Coverage

### ICS Data Retrieval

- Test with local file path
- Test with HTTP URL
- Test with HTTPS URL
- Test error handling for invalid paths/URLs

### Org File Creation

- Test with valid event data
- Test with recurring events
- Test with different event properties
- Test file output validation

### Complete Workflow

- Test end-to-end conversion
- Test with sample ICS files
- Test output file validation
- Test error scenarios

## Test Data

### Sample ICS File Structure

```
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-event-1
DTSTART:20230101T100000Z
DTEND:20230101T110000Z
SUMMARY:Test Event
DESCRIPTION:This is a test event
LOCATION:Test Location
END:VEVENT
END:VCALENDAR
```

## Test Execution

### Package.json Scripts

```json
{
  "scripts": {
    "test": "mocha test/**/*.test.js",
    "test:unit": "mocha test/unit/**/*.test.js",
    "test:integration": "mocha test/integration/**/*.test.js",
    "test:watch": "mocha test/**/*.test.js --watch"
  }
}
```

## Quality Gates

1. All bug fixes must have corresponding unit tests
2. All existing functionality must pass tests after refactoring
3. Test coverage should be at least 80% for core functions
4. All tests must pass before merging changes

## Continuous Integration

Consider adding a GitHub Actions workflow for automated testing:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "14"
      - run: npm install
      - run: npm test
```
