# ICSORG Improvement Plan

This document outlines the identified improvements for the icsorg project, including bug fixes, refactoring opportunities, and testing enhancements.

## Bug Fixes (High Priority)

### 1. Fix parameter passing bug in `parseAttendee` function

**File:** `src/index.js` (line 262)
**Issue:** Incorrect parameter passing in `map` function call
**Current Code:**

```javascript
attendees: e.attendees.map((a) => parseAttendee(a.jCal[1]), author, email);
```

**Fix:**

```javascript
attendees: e.attendees.map((a) => parseAttendee(a.jCal[1], author, email));
```

### 2. Fix bug in `parseDuration` function

**File:** `src/index.js` (line 120)
**Issue:** Using `d.hours` twice instead of `d.minutes`
**Current Code:**

```javascript
return `${d.weeks} wk ${d.days} d ${pad(d.hours)}:${pad(d.hours)} hh:mm`;
```

**Fix:**

```javascript
return `${d.weeks} wk ${d.days} d ${pad(d.hours)}:${pad(d.minutes)} hh:mm`;
```

## Refactoring Opportunities

### 3. Extract configuration management

**File:** `src/index.js`
**Issue:** Configuration parsing in `main()` is quite long and could be extracted into a separate function for better readability.

### 4. Add parameter validation

**File:** `src/index.js`
**Issue:** Need to validate that required parameters like `ICS_FILE` and `ORG_FILE` are provided before proceeding.

## Testing

### 5. Add unit tests

**Files:** New test files to be created
**Functions to test:**

- `parseAttendee`
- `parseDuration`
- `makeTimestamp`
- `makeMailtoLink`
- `getPropertyValue`

### 6. Add integration tests

**Files:** New test files to be created
**Tests to implement:**

- `getIcsData` with both file and URL sources
- `createOrgFile` with sample data
- Complete workflow with sample ICS data

## Additional Improvements

### 7. Improve error messages

**File:** `src/index.js`
**Issue:** Provide more context about what went wrong and how to fix it.

### 8. Add JSDoc to all functions

**File:** `src/index.js`
**Issue:** Some functions are missing documentation.

## Priority Levels

### High Priority

1. Fix parameter passing bug in `parseAttendee`
2. Fix bug in `parseDuration`

### Medium Priority

3. Extract configuration management
4. Add parameter validation
5. Add unit tests

### Low Priority

6. Add integration tests
7. Improve error messages
8. Add JSDoc to all functions

## Implementation Order

1. Fix critical bugs first (items 1-2)
2. Add unit tests for fixed functions
3. Refactor configuration management (item 3)
4. Add parameter validation (item 4)
5. Add remaining unit tests
6. Add integration tests
7. Improve error messages and documentation
