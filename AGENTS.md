# AGENTS.md - Developer Guide for icsorg

This guide provides coding standards and workflows for AI agents working on the **icsorg** project - a Node.js CLI tool that imports ICS calendar files into Emacs Org mode format.

## Project Overview

- **Language:** JavaScript (ES6+, ES Modules)
- **Runtime:** Node.js v14+ (no TypeScript)
- **Architecture:** CLI entry point (`src/index.js`) + testable library (`src/lib.js`)
- **Purpose:** Convert ICS calendar files/URLs → Org-mode files for Emacs agenda

## Build, Lint & Test Commands

### Linting

```bash
# Run ESLint (manually - no npm script defined)
npx eslint src/

# Auto-fix linting issues
npx eslint src/ --fix
```

### Formatting

```bash
# Check formatting with Prettier
npx prettier --check src/

# Auto-format code
npx prettier --write src/
```

### Testing

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run a specific test file
npx mocha test/unit/parseConfig.test.js

# Watch mode
npm run test:watch
```

Tests are located in:
- `test/unit/` - Unit tests for individual functions in `src/lib.js`
- `test/integration/` - Integration tests (e.g., real file I/O, HTTP)
- `test/fixtures/` - Sample `.ics` files used by integration tests

### Running the Application

```bash
# Show help
node src/index.js -h

# Run with config file
node src/index.js -c ~/.icsorgrc

# Run with command-line options
node src/index.js -i input.ics -o output.org -a "Author Name" -e author@example.com

# Debug output
# Set doDebug = true in code or use argv.d flag
```

## Code Style Guidelines

### Formatting Rules (Prettier + ESLint)

**Indentation & Spacing:**

- 2 spaces (no tabs)
- Max line length: 80 characters
- Space before opening brace
- Spaces around operators

**Quotes & Semicolons:**

- **Always double quotes** (`"string"`) - ESLint enforced
- **Semicolons required** at statement end
- Template literals (backticks) for interpolation: `` `Error: ${msg}` ``

**Example:**

```javascript
function makeTimestamp(start, end, type = "active") {
  const fmt = "yyyy-MM-dd EEE HH:mm";
  return `<${start.toFormat(fmt)}--${end.toFormat(fmt)}>`;
}
```

### Import/Export Conventions

**Import Style:**

- ES6 modules (`import`/`export`)
- Named imports with destructuring preferred
- Default imports for main module exports
- All imports grouped at top of file

**Example (from src/index.js):**

```javascript
import fetch from "node-fetch";
import { Readable } from "stream";
import IcalExpander from "ical-expander";
import { createWriteStream, readFileSync } from "fs";
import { DateTime } from "luxon";
import parseArgs from "minimist";
import dotenv from "dotenv";
```

**Note:** Imports are currently mixed (external and built-ins together). For new code, consider grouping Node.js built-ins first, then external dependencies alphabetically.

**Exports:**

- `src/lib.js` exports all utility functions as named exports
- `src/index.js` has no exports — it is a CLI entry point only

### Naming Conventions

**Functions - camelCase:**

- Verb-first names: `doHelp()`, `parseAttendee()`, `createOrgFile()`
- Factory functions: `makeTimestamp()`, `makeMailtoLink()`
- Getters: `getPropertyValue()`, `getIcsData()`
- Transformers: `mapEvents()`, `dumpEvent()`

**Variables - camelCase:**

- Descriptive: `mappedEvents`, `allEvents`, `startDate`
- Short single letters OK for iterations: `e`, `a`, `h` (in callbacks)
- Prefer `const` for immutable, `let` for mutable (never `var`)

**Constants - SCREAMING_SNAKE_CASE:**

- Configuration keys: `ICS_FILE`, `ORG_FILE`, `AUTHOR`, `EMAIL`
- Environment variables: `TITLE`, `CATEGORY`, `STARTUP`, `FILETAGS`
- Values that never change: `RC`, `PAST`, `FUTURE`

**Files - lowercase:**

- Source files: `index.js`
- Config files: `.icsorgrc`, `package.json`, `.eslintrc.json`
- Documentation files: `README.org` (source), `README.md` (generated), `AGENTS.md`

### Type Annotations (JSDoc)

**Use JSDoc for all functions:**

```javascript
/**
 * Parse a duration object to create a duration string
 *
 * @param {Object} d - duration object with weeks, days, hours, minutes
 *
 * @returns {string} formatted duration string (e.g., "2 d 03:45 hh:mm")
 */
function parseDuration(d) {
  // Implementation
}

/**
 * @async
 *
 * Retrieve event data from ICS source (URL or file path)
 *
 * @param {string} source - either path to a local file or a URL
 *
 * @returns {Promise<string>} The .ics data as a string
 */
async function getIcsData(source) {
  // Implementation
}
```

**Type Documentation:**

- Primitives: `{string}`, `{number}`, `{boolean}`, `{Object}`, `{Array}`
- Specific types: `{DateTime}`, `{Date}`, `{stream}`
- Use `@async` tag for async functions
- Document parameters and return values

### Error Handling

**Try-Catch Pattern:**

```javascript
try {
  const result = await someOperation();
  return processResult(result);
} catch (err) {
  throw new Error(`functionName: ${err.message}`);
}
```

**Rules:**

- Prefix error messages with function name
- Preserve original error message: `${err.message}`
- Let errors bubble up to top-level handler
- Use descriptive error messages

**Top-Level Handler:**

```javascript
main().catch((err) => {
  console.error(err.message);
});
```

**Validation:**

- Use ternary operators for optional fields
- Guard clauses with conditional operators
- Default parameters: `type = "active"`

**Example:**

```javascript
e.organizer ? rs.push(`:ORGANIZER: ${makeMailtoLink(e.organizer)}\n`) : null;
data && data.startsWith("mailto:") ? data : `mailto:${data}`;
```

## Code Organization Patterns

### Function Design

- **Single Responsibility:** Each function does one thing
- **Small functions:** Most under 30 lines
- **Pure functions preferred:** Return values, avoid side effects where possible
- **Extract helpers:** Use inner functions for local utilities

### Functional Programming Style

```javascript
// Prefer map/filter/reduce over loops
const mappedEvents = events.map((e) => ({
  endDate: e.endDate.toJSDate(),
  startDate: e.startDate.toJSDate(),
  ...commonEventProperties(e, author, email),
}));

// Use spread operator for composition
const allEvents = [...mappedEvents, ...mappedOccurrences];

// Arrow functions for callbacks
events.forEach((e) => dumpEvent(e, rs));
attendees.map((a) => `${makeMailtoLink(a.cn)} (${a.status})`);
```

### Async/Await

- **Always use async/await** (never `.then()/.catch()` chains)
- Mark functions `async` when they await
- Handle promises at top level

### Stream-Based I/O

`createOrgFile` in `src/lib.js` uses Node.js streams and returns a Promise that resolves on the `'finish'` event and rejects on `'error'`. Always `await` it.

```javascript
await createOrgFile(config, allEvents);
```

## Configuration Management

**Cascading Priority:** CLI args → env vars → defaults

```javascript
const config = {
  ICS_FILE: argv.i || process.env.ICS_FILE,
  ORG_FILE: argv.o || process.env.ORG_FILE,
  TITLE: process.env.TITLE || "Calendar",
  AUTHOR: argv.a || process.env.AUTHOR,
};
```

## Dependencies

**Runtime:**

- `dotenv` - Environment variables from `.icsorgrc`
- `ical-expander` - ICS file parsing
- `luxon` - Date/time formatting (modern alternative to moment.js)
- `minimist` - CLI argument parsing
- `node-fetch` - HTTP requests (fetch API for Node)

**Development:**

- `eslint` + `eslint-config-prettier` - Linting
- `prettier` - Code formatting
- `mocha` + `chai` - Testing

## Git Workflow

- **Commit messages:** Conventional format preferred
- **Branch naming:** `feature/`, `fix/`, `docs/`
- **No force pushes** to main branch

## Key Architectural Notes

1. **Two-module design** - `src/index.js` is the CLI entry point; `src/lib.js` contains all testable pure/async functions
2. **No TypeScript** - use JSDoc for type documentation
3. **CLI-first design** - console output is expected (`no-console: 0`)
4. **Emacs integration** - output must be valid Org-mode syntax
5. **Stream processing** - `createOrgFile` uses Node.js streams and returns a Promise
6. **87 tests** - unit tests cover all lib.js exports; integration tests cover file I/O and HTTP

## Documentation Files

The project maintains documentation in multiple formats:

- **README.org** - Primary source for project documentation in Org mode format
- **README.md** - Generated from README.org, should not be edited directly
- **AGENTS.md** - Developer guide for AI agents working on the project

To convert README.org to README.md, use the script `org-to-gfm.sh`. The script takes one argument which is the path to the org file to be converted into markdown.
