/**
 * Library module containing testable functions for icsorg
 */

import fetch from "node-fetch";
import { readFileSync } from "fs";
import { DateTime } from "luxon";

// Debug state - set from index.js
let debugEnabled = false;

/**
 * Enable or disable debug output
 *
 * @param {boolean} enabled - Whether debug output should be enabled
 */
export function setDebugMode(enabled) {
  debugEnabled = enabled;
}

/**
 * Output debug message if debug mode is enabled
 *
 * @param {string} functionName - Name of the function being debugged
 * @param {string} message - Debug message
 * @param {*} data - Optional data to output
 */
export function debug(functionName, message, data) {
  if (debugEnabled) {
    console.log(`[DEBUG] ${functionName}: ${message}`);
    if (data !== undefined) {
      console.dir(data, { depth: null, colors: true });
    }
  }
}

/**
 * Parse and validate configuration settings from command line arguments and environment
 *
 * @param {Object} argv - Parsed command line arguments
 * @param {string} rcFile - Path to the RC configuration file
 *
 * @returns {Object} Configuration object with all settings
 */
export function parseConfig(argv, rcFile) {
  debug("parseConfig", "Called with arguments", { argv, rcFile });

  const config = {
    RC_FILE: rcFile,
    ICS_FILE: argv.i || process.env.ICS_FILE,
    ORG_FILE: argv.o || process.env.ORG_FILE,
    TITLE: process.env.TITLE || "Calendar",
    AUTHOR: argv.a || process.env.AUTHOR,
    EMAIL: argv.e || process.env.EMAIL,
    CATEGORY: process.env.CATEGORY,
    STARTUP: process.env.STARTUP,
    FILETAGS: process.env.FILETAGS,
    PAST: 7,
    FUTURE: 365,
  };

  debug("parseConfig", "Initial config created", config);

  // Parse PAST days
  if (argv.p !== undefined) {
    config.PAST = parseInt(argv.p);
    debug("parseConfig", `PAST set from CLI argument: ${config.PAST}`);
  } else if (process.env.PAST !== undefined) {
    config.PAST = parseInt(process.env.PAST);
    debug("parseConfig", `PAST set from environment: ${config.PAST}`);
  }

  // Parse FUTURE days
  if (argv.f !== undefined) {
    config.FUTURE = parseInt(argv.f);
    debug("parseConfig", `FUTURE set from CLI argument: ${config.FUTURE}`);
  } else if (process.env.FUTURE !== undefined) {
    config.FUTURE = parseInt(process.env.FUTURE);
    debug("parseConfig", `FUTURE set from environment: ${config.FUTURE}`);
  }

  // Calculate date ranges
  config.START_DATE = DateTime.now().minus({ days: config.PAST });
  config.END_DATE = DateTime.now().plus({ days: config.FUTURE });

  debug("parseConfig", "Date ranges calculated", {
    START_DATE: config.START_DATE.toISO(),
    END_DATE: config.END_DATE.toISO(),
  });

  debug("parseConfig", "Returning final config", config);
  return config;
}

/**
 * Validate required configuration parameters
 *
 * @param {Object} config - Configuration object to validate
 *
 * @throws {Error} if required parameters are missing
 */
export function validateConfig(config) {
  debug("validateConfig", "Called with config", config);

  const errors = [];

  if (!config.ICS_FILE) {
    errors.push(
      "Missing required ICS_FILE parameter. Specify with -i option or ICS_FILE environment variable.",
    );
    debug("validateConfig", "Validation error: Missing ICS_FILE");
  }

  if (!config.ORG_FILE) {
    errors.push(
      "Missing required ORG_FILE parameter. Specify with -o option or ORG_FILE environment variable.",
    );
    debug("validateConfig", "Validation error: Missing ORG_FILE");
  }

  // Validate numeric values
  if (isNaN(config.PAST) || config.PAST < 0) {
    errors.push(
      `Invalid PAST value: ${config.PAST}. Must be a positive number.`,
    );
    debug(
      "validateConfig",
      `Validation error: Invalid PAST value: ${config.PAST}`,
    );
  }

  if (isNaN(config.FUTURE) || config.FUTURE < 0) {
    errors.push(
      `Invalid FUTURE value: ${config.FUTURE}. Must be a positive number.`,
    );
    debug(
      "validateConfig",
      `Validation error: Invalid FUTURE value: ${config.FUTURE}`,
    );
  }

  if (errors.length > 0) {
    debug(
      "validateConfig",
      `Validation failed with ${errors.length} error(s)`,
      errors,
    );
    throw new Error(
      `Configuration validation failed:\n  ${errors.join("\n  ")}`,
    );
  }

  debug("validateConfig", "Validation passed successfully");
}

/**
 * Parse an attendee array to generate an attendee object
 *
 * @param {Object} data - Object of data about an attendee
 * @param {string} author - Author's name - used to identify 'me' attendee
 * @param {string} email - Email address - used to identify 'me' attendee
 *
 * @returns {Object} with properties for category, role, status, cn, guests and me
 */
export function parseAttendee(data, author, email) {
  return {
    category: data.category,
    role: data.role,
    status: data.partstat,
    cn: data.cn,
    guests: data["x-num-guests"],
    me: data.cn === author || data.cn === email ? true : false,
  };
}

/**
 * Parse a duration object to create a duration string
 *
 * @param {Object} d - duration object
 *
 * @returns {string} formatted duration string
 */
export function parseDuration(d) {
  function pad(v) {
    return v < 10 ? `0${v}` : `${v}`;
  }

  if (d.weeks) {
    return `${d.weeks} wk ${d.days} d ${pad(d.hours)}:${pad(d.minutes)} hh:mm`;
  } else if (d.days) {
    return `${d.days} d ${pad(d.hours)}:${pad(d.minutes)} hh:mm`;
  } else {
    return `${pad(d.hours)}:${pad(d.minutes)} hh:mm`;
  }
}

/**
 * Make an org timestamp from a Luxon DateTime object
 *
 * @param {Date} dt - JavaScript Date object
 * @param {string} type - type of timestamp. Either 'active' or 'inactive'
 *                        Defaults to 'active'
 *
 * @returns {string} org timestamp string
 */
export function makeTimestamp(dt, type = "active") {
  let start = "<";
  let end = ">";

  if (type === "inactive") {
    start = "[";
    end = "]";
  }
  const fmt = `${start}yyyy-LL-dd ccc HH:mm${end}`;
  if (dt) {
    let date = DateTime.fromJSDate(dt);
    return date.toFormat(fmt, { locale: "au" });
  }
  return "";
}

/**
 * Generates an org ranged (duration) timestamp string
 *
 * @param {Date} start - start date and time
 * @param {Date} end - end date and time
 *
 * @returns {string} an org timestamp string
 */
export function makeTimestampRange(start, end) {
  const fmt = "<yyyy-LL-dd ccc HH:mm>";
  const sDate = DateTime.fromJSDate(start);
  const eDate = DateTime.fromJSDate(end);
  if (sDate.hasSame(eDate, "day")) {
    let fmt1 = "<yyyy-LL-dd ccc HH:mm-";
    let fmt2 = "HH:mm>";
    return `${sDate.toFormat(fmt1)}${eDate.toFormat(fmt2)}`;
  }
  return `${sDate.toFormat(fmt)}--${eDate.toFormat(fmt)}`;
}

/**
 * Examines the supplied value and if it looks like a mailto or email address
 * generates and org link string.
 *
 * @param {string} data - value to use.
 *
 * @returns {string} If value looks like a mailto or email address,
 *                   return an org link string, otherwise, just return
 *                   the value passed in
 */
export function makeMailtoLink(data) {
  if (data && data.startsWith("mailto:")) {
    let addr = data.substring(7);
    return `[[${data}][${addr}]]`;
  } else if (data && data.includes("@")) {
    return `[[mailto:${data}][${data}]]`;
  }
  return data;
}

/**
 * Get named property from a component
 *
 * @param {string} name - property name
 * @param {Object} component - an ICS component
 *
 * @returns {Date | string} property value
 */
export function getPropertyValue(name, component) {
  let prop = component.getFirstProperty(name);
  if (prop) {
    switch (prop.getDefaultType()) {
      case "text":
        return prop.getFirstValue();
      case "date-time": {
        let val = prop.getFirstValue();
        return val.toJSDate();
      }
      default:
        return prop.getFirstValue().toString();
    }
  }
  return "";
}

/**
 * @async
 *
 * Retrieve event data from ICS source. This could be either a local file
 * or a URL which returns an .ics file (like Google).
 *
 * @param {string} source - either path to a local file or a URL which will return an .ics file
 *
 * @returns {Promise<string>} The .ics data as a string
 */
export async function getIcsData(source) {
  debug("getIcsData", "Called with source", { source });

  let data = "";

  try {
    if (source.startsWith("http")) {
      // assume source is a url
      debug("getIcsData", "Fetching from URL");
      let resp = await fetch(source);
      debug("getIcsData", "Fetch response received", {
        status: resp.status,
        statusText: resp.statusText,
      });
      data = await resp.text();
      debug("getIcsData", `Retrieved ${data.length} bytes from URL`);
    } else {
      // assume is a file name
      debug("getIcsData", "Reading from file");
      data = readFileSync(source, "utf-8");
      debug("getIcsData", `Read ${data.length} bytes from file`);
    }

    debug("getIcsData", "Successfully retrieved ICS data", {
      dataLength: data.length,
      preview: data.substring(0, 100),
    });
    return data;
  } catch (err) {
    debug("getIcsData", "Error occurred", { error: err.message });
    throw new Error(`getIcsData: ${err.message}`);
  }
}
