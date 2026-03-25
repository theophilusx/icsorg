#!/usr/bin/env node

import IcalExpander from "ical-expander";
import parseArgs from "minimist";
import dotenv from "dotenv";
import {
  parseAttendee,
  getPropertyValue,
  getIcsData,
  parseConfig,
  validateConfig,
  setDebugMode,
  createOrgFile,
  debug as libDebug,
} from "./lib.js";

const argv = parseArgs(process.argv.slice(2));
const RC = argv.c || `${process.env.HOME}/.icsorgrc`;
dotenv.config({ path: RC, quiet: true });

/**
 * Display a basic usage message to the console
 * Will call process.exit to terminate the script
 */
function doHelp() {
  let help = [
    "Usage: icsorg <optional arguments>",
    "",
    "Arguments:",
    "  -a                 Author. Used for attendee matching",
    "  -d                 Turn on debug messages",
    "  -e                 Email. Used for attendee matching",
    "  -f                 Number of days into the future to include events from. Default 365",
    "  -h | --help        Display short help message",
    "  -c config_file     Path to configuration file",
    "  -i input_file      Path to the ICS file to use as input",
    "  -o output_file     Path to the output file to be created (org file)",
    "  -p days            Number of days in the past to include events from. Default 7",
    "  --dump             Dump the current configuration and exit",
    "",
    "By default, the script will look for a file called '.icsorgrc' in the",
    "user's home directory. This can be overridden with the -c switch",
    "Command line switches override values in the configuration file",
    "",
    "The configuration file consists of NAME=value lines. The file will be",
    "processed using the dotenv module, which will create environment variables",
    "from the values in this file. The expected values are -",
    "",
    "  AUTHOR -   Your name. Used to identify you in meeting attendee lists",
    "  EMAIL  -   Your email address. Also used to identify you in attendee lists",
    "  ICS_FILE - Path to ICS file to use for input. This can be overridden with the -i option",
    "  ORG_FILE - Path to the org file to write events to. It will override any existing.",
    "             It can be overridden with the -o option",
    "  TITLE -    The #+TITLE: header to use in the org file. Defaults to 'Calendar'",
    "  CATEGORY - A value for #+CATEGORY header. No default",
    "  STARTUP -  A value for #+STARTUP header. No default",
    "  FILETAGS - A value for #+FILETAGS header. No default",
    "  PAST -     Number of days in the past to include events from. Default 7",
    "  FUTURE -   Number of days into the future to include events from. Default 365",
    "",
    "  Homepage - https://github.com/theophilusx/icsorg",
  ];
  console.log(help.join("\n"));
  process.exit(0);
}

/**
 * Dump out script configuration settings to the console.
 * Will call process.exit to terminate the script
 *
 * @param {Object} config - Object containing script config settings
 */
function dumpConfig(config) {
  let msg = [];
  console.log("Current Config");
  for (let k in config) {
    msg.push(`${k} = ${config[k]}`);
  }
  console.log(msg.join("\n"));
  process.exit(0);
}

/**
 * Extract common properties from event and occurrence components
 *
 * @param {Object} e - an event component
 * @param {string} author - author's name
 * @param {string} email - author's email address
 *
 * @returns {Object} object containing common event properties
 */
function commonEventProperties(e, author, email) {
  return {
    attendees: e.attendees.map((a) => parseAttendee(a.jCal[1], author, email)),
    description: e.description,
    duration: e.duration,
    location: e.location,
    organizer: e.organizer,
    uid: e.uid,
    status: getPropertyValue("status", e.component),
    modified: getPropertyValue("last-modified", e.component),
    summary: e.summary,
  };
}

/**
 * Process an array of event components to generate event objects.
 * Returns an array of event objects.
 *
 * @param {Array} events - An array of event components
 * @param {string} author - author name
 * @param {string} email - author's email address
 *
 * @returns {Array} array of event objects
 */
function mapEvents(events, author, email) {
  libDebug("mapEvents", "Called with parameters", {
    eventCount: events.length,
    author,
    email,
  });

  let mappedEvents = events.map((e) => ({
    endDate: e.endDate.toJSDate(),
    startDate: e.startDate.toJSDate(),
    ...commonEventProperties(e, author, email),
  }));

  libDebug("mapEvents", `Mapped ${mappedEvents.length} events`);
  return mappedEvents;
}

/**
 * Generate an array of event objects from an array of occurrence components
 *
 * @param {Array} occurrences - Array of occurrence components
 * @param {string} author - author name
 * @param {string} email - author's email address
 *
 * @returns {Array} array of event objects
 */
function mapOccurrences(occurrences, author, email) {
  libDebug("mapOccurrences", "Called with parameters", {
    occurrenceCount: occurrences.length,
    author,
    email,
  });

  let mappedOccurrences = occurrences.map((o) => ({
    startDate: o.startDate.toJSDate(),
    endDate: o.endDate.toJSDate(),
    ...commonEventProperties(o.item, author, email),
  }));

  libDebug("mapOccurrences", `Mapped ${mappedOccurrences.length} occurrences`);
  return mappedOccurrences;
}

/**
 * @async
 *
 * Main entry point for script
 */
async function main() {
  if (argv.h || argv.help) {
    doHelp();
  }

  if (argv.d || process.env.DEBUG) {
    setDebugMode(true);
    libDebug("main", "Debug mode enabled");
  }

  try {
    libDebug("main", "Starting main workflow");

    const config = parseConfig(argv, RC);
    validateConfig(config);

    if (argv.dump) {
      dumpConfig(config);
    }

    libDebug("main", "Fetching ICS data", { source: config.ICS_FILE });
    let data = await getIcsData(config.ICS_FILE);

    libDebug("main", "Parsing ICS data with expander", {
      dataLength: data.length,
      maxIterations: 1000,
    });
    const expander = new IcalExpander({ ics: data, maxIterations: 1000 });

    libDebug("main", "Extracting events between dates", {
      startDate: config.START_DATE.toISO(),
      endDate: config.END_DATE.toISO(),
    });
    const events = expander.between(
      config.START_DATE.toJSDate(),
      config.END_DATE.toJSDate(),
    );

    libDebug("main", "Events extracted", {
      eventCount: events.events.length,
      occurrenceCount: events.occurrences.length,
    });

    libDebug("main", "Mapping events", {
      author: config.AUTHOR,
      email: config.EMAIL,
    });
    const mappedEvents = mapEvents(events.events, config.AUTHOR, config.EMAIL);

    libDebug("main", "Mapping occurrences");
    const mappedOccurrences = mapOccurrences(
      events.occurrences,
      config.AUTHOR,
      config.EMAIL,
    );

    let allEvents = [...mappedEvents, ...mappedOccurrences];
    libDebug("main", "Total events to write", {
      totalEvents: allEvents.length,
      mappedEvents: mappedEvents.length,
      mappedOccurrences: mappedOccurrences.length,
    });

    libDebug("main", "Creating org file", { outputFile: config.ORG_FILE });
    await createOrgFile(config, allEvents);

    libDebug("main", "Workflow completed successfully");
    console.log(
      `Generated new org file in ${config.ORG_FILE} with ${allEvents.length} entries`,
    );
  } catch (err) {
    libDebug("main", "Error occurred in main workflow", { error: err.message });
    throw new Error(`main: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(err.message);
});
