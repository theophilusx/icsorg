# Debug Implementation Summary

## Overview

This document summarizes the implementation of comprehensive debugging functionality for the icsorg project. When the `-d` flag is set, the application now displays detailed debug messages showing when top-level functions are called and what data is passed in.

## What Was Implemented

### 1. Debug Infrastructure in lib.js

**Created debug utility functions:**

- `setDebugMode(enabled)` - Enable/disable debug output globally
- `debug(functionName, message, data)` - Output formatted debug messages

**Features:**

- Centralized debug state management
- Formatted output with `[DEBUG]` prefix
- Colorized object output using `console.dir`
- Optional data parameter for detailed inspection

### 2. Debug Messages in Core Functions

#### parseConfig()

Debug messages show:

- Input arguments (argv, rcFile)
- Initial configuration object
- PAST/FUTURE value sources (CLI vs environment)
- Calculated date ranges
- Final configuration object

#### validateConfig()

Debug messages show:

- Input configuration object
- Validation errors as they occur
- Success/failure status

#### getIcsData()

Debug messages show:

- Source (file path or URL)
- Source type (file vs URL)
- HTTP response status (for URLs)
- Data size retrieved
- Data preview (first 100 bytes)
- Success/error status

#### mapEvents()

Debug messages show:

- Input parameters (event count, author, email)
- Number of events mapped

#### mapOccurences()

Debug messages show:

- Input parameters (occurrence count, author, email)
- Number of occurrences mapped

#### createOrgFile()

Debug messages show:

- Output file path
- Event count
- File creation steps
- Success/error status

#### main()

Debug messages show:

- Workflow start
- Each major step in the process
- Data passed between steps
- Event counts at each stage
- Success completion

### 3. Activation

Debug mode is activated when:

- `-d` flag is used on command line
- `DEBUG` environment variable is set

Example:

```bash
node src/index.js -d -i input.ics -o output.org
```

## Debug Output Format

### Standard Format

```
[DEBUG] functionName: message
```

### With Data

```
[DEBUG] functionName: message
{
  property: value,
  nested: {
    data: here
  }
}
```

## Example Debug Output

```bash
$ node src/index.js -d -i sample.ics -o output.org -a "John Doe" -e "john@example.com"

[DEBUG] main: Debug mode enabled
[DEBUG] main: Starting main workflow
[DEBUG] parseConfig: Called with arguments
{
  argv: { d: true, i: 'sample.ics', o: 'output.org', a: 'John Doe', e: 'john@example.com' },
  rcFile: '/home/user/.icsorgrc'
}
[DEBUG] parseConfig: Initial config created
{
  RC_FILE: '/home/user/.icsorgrc',
  ICS_FILE: 'sample.ics',
  ORG_FILE: 'output.org',
  TITLE: 'Calendar',
  AUTHOR: 'John Doe',
  EMAIL: 'john@example.com',
  ...
}
[DEBUG] parseConfig: Date ranges calculated
{
  START_DATE: '2026-01-27T12:00:00.000+11:00',
  END_DATE: '2027-01-27T12:00:00.000+11:00'
}
[DEBUG] validateConfig: Called with config
[DEBUG] validateConfig: Validation passed successfully
[DEBUG] main: Fetching ICS data
[DEBUG] getIcsData: Called with source
{ source: 'sample.ics' }
[DEBUG] getIcsData: Reading from file
[DEBUG] getIcsData: Read 1601 bytes from file
[DEBUG] getIcsData: Successfully retrieved ICS data
[DEBUG] main: Parsing ICS data with expander
[DEBUG] main: Extracting events between dates
[DEBUG] main: Events extracted
{ eventCount: 3, occurrenceCount: 0 }
[DEBUG] main: Mapping events
[DEBUG] mapEvents: Called with parameters
{ eventCount: 3, author: 'John Doe', email: 'john@example.com' }
[DEBUG] mapEvents: Mapped 3 events
[DEBUG] main: Mapping occurrences
[DEBUG] mapOccurences: Called with parameters
{ occurrenceCount: 0, author: 'John Doe', email: 'john@example.com' }
[DEBUG] mapOccurences: Mapped 0 occurrences
[DEBUG] main: Total events to write
{ totalEvents: 3, mappedEvents: 3, mappedOccurrences: 0 }
[DEBUG] main: Creating org file
[DEBUG] createOrgFile: Called with parameters
{ outputFile: 'output.org', eventCount: 3, title: 'Calendar' }
[DEBUG] createOrgFile: Creating write stream
[DEBUG] createOrgFile: Writing header
[DEBUG] createOrgFile: Writing 3 events
[DEBUG] createOrgFile: File creation completed
[DEBUG] main: Workflow completed successfully
Generated new org file in output.org with 3 entries
```

## Code Changes

### Files Modified

**src/lib.js:**

- Added `debugEnabled` state variable
- Added `setDebugMode()` function
- Added `debug()` function
- Added debug messages to:
  - `parseConfig()`
  - `validateConfig()`
  - `getIcsData()`

**src/index.js:**

- Imported `setDebugMode` and `debug as libDebug`
- Removed old `debug()` function
- Removed unused `doDebug` variable
- Added debug mode activation in `main()`
- Added debug messages to:
  - `main()` workflow
  - `mapEvents()`
  - `mapOccurences()`
  - `createOrgFile()`

### Lines Added

- **lib.js**: ~30 new lines for debug infrastructure and messages
- **index.js**: ~25 new lines for debug messages

## Benefits

### 1. Troubleshooting

- Easy to trace execution flow
- See exactly what data is being processed
- Identify where errors occur
- Verify configuration is correct

### 2. Development

- Understand how the application processes data
- Debug issues without adding temporary console.log statements
- Verify function inputs and outputs

### 3. User Support

- Users can provide detailed logs for support
- Maintainers can quickly identify issues
- No code changes needed to get diagnostic information

## Usage Examples

### Basic Debug

```bash
node src/index.js -d -i input.ics -o output.org
```

### Debug with Custom Config

```bash
node src/index.js -d -c ~/.custom-config -i input.ics -o output.org -a "User Name" -e "user@example.com"
```

### Debug with Date Ranges

```bash
node src/index.js -d -i input.ics -o output.org -p 30 -f 90
```

### Debug with Environment Variable

```bash
DEBUG=1 node src/index.js -i input.ics -o output.org
```

## Testing

### Test Results

```
✓ 80 passing (48ms)
✓ 0 failing
✓ No linting errors
```

### Manual Testing

- ✅ Debug output with `-d` flag
- ✅ No debug output without `-d` flag
- ✅ All workflow steps show debug messages
- ✅ Data is properly formatted and readable
- ✅ Error scenarios show debug information

## Performance Impact

The debug infrastructure has minimal performance impact:

- When debug is disabled: No overhead (early returns)
- When debug is enabled: Minimal overhead from console.log calls
- No impact on normal operation without `-d` flag

## Future Enhancements

Possible future improvements:

1. Debug levels (verbose, info, warning, error)
2. Debug output to file
3. Selective debug by function/module
4. Timestamp for each debug message
5. Performance timing information

## Conclusion

The debug implementation provides comprehensive visibility into the application's execution flow and data processing. It's easy to use, adds minimal code complexity, and provides significant value for troubleshooting and development.
