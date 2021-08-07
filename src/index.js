#!/usr/bin/env node

"use strict";

const fetch = require("node-fetch");
const { Readable } = require("stream");
const IcalExpander = require("ical-expander");
const fs = require("fs");
const { DateTime } = require("luxon");
const argv = require("minimist")(process.argv.slice(2));

const RC = argv.c || `${process.env.HOME}/.icsorgrc`;
require("dotenv").config({ path: RC });

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
  for (let k in config) {
    msg.push(`${k} = ${config[k]}`);
  }
  console.log(msg.join("\n"));
  process.exit(0);
}

/**
 * Parse an attendee array to generate an attendee object
 *
 * @param {Array} data - Array of data about an attendee
 * @param {string} author - Author's name - used to identify 'me' attendee
 * @param {string} email - Email address - used to identify 'me' attendee
 *
 * @returns {Object} with properties for category, role, status, cn, guests and me
 */
function parseAttendee(data, author, email) {
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
 * @returns {string}
 */
function parseDuration(d) {
  function pad(v) {
    return v < 10 ? `0${v}` : `${v}`;
  }

  if (d.weeks) {
    return `${d.weeks} wk ${d.days} d ${pad(d.hours)}:${pad(d.hours)} hh:mm`;
  } else if (d.days) {
    return `${d.days} d ${pad(d.hours)}:${pad(d.minutes)} hh:mm`;
  } else {
    return `${pad(d.hours)}:${pad(d.minutes)} hh:mm`;
  }
}

/**
 * Make an org timestamp from a Luxon DateTime object
 *
 * @param {DateTime} dt - Luxon DateTime object
 * @param {string} type - type of timestamp. Either 'active' or 'inactive'
 *                        Defaults to 'active'
 *
 * @returns {string} org timestamp string
 */
function makeTimestamp(dt, type = "active") {
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
 * @param {DateTime} start - start date and time
 * @param {DateTime} end - end date and time
 *
 * @returns {string} an org timestamp string
 */
function makeTimestampRange(start, end) {
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
function makeMailtoLink(data) {
  if (data && data.startsWith("mailto:")) {
    let addr = data.substring(7);
    return `[[${data}][${addr}]]`;
  } else if (data && data.includes("@")) {
    return `[[mailto:${data}][${data}]]`;
  }
  return data;
}

/**
 * dumps out an event to the specified read stream
 *
 * @param {Object} e - event object
 * @param {stream} rs - stream to push data onto
 */
function dumpEvent(e, rs) {
  rs.push(`* ${e.summary}\n`);
  rs.push(":PROPERTIES:\n");
  rs.push(":ICAL_EVENT:    t\n");
  rs.push(`:ID:            ${e.uid}\n`);
  e.organizer
    ? rs.push(`:ORGANIZER:     ${makeMailtoLink(e.organizer)}\n`)
    : null;
  e.status ? rs.push(`:STATUS:        ${e.status}\n`) : null;
  e.modified
    ? rs.push(`:LAST_MODIFIED: ${makeTimestamp(e.modified, "inactive")}\n`)
    : null;
  e.location ? rs.push(`:LOCATION:      ${e.location}\n`) : null;
  e.duration ? rs.push(`:DURATION:      ${parseDuration(e.duration)}\n`) : null;
  e.attendees.length
    ? rs.push(
        `:ATTENDEES:    ${e.attendees
          .map((a) => `${makeMailtoLink(a.cn)} (${a.status})`)
          .join(", ")}`
      ) && rs.push("\n")
    : null;
  rs.push(":END:\n");
  rs.push(makeTimestampRange(e.startDate, e.endDate));
  rs.push("\n");
  e.description ? rs.push(`\n${e.description}\n`) : null;
}

/**
 * Get named property from a component
 *
 * @param {string} name - property name
 * @param {Object} component - an ICS component
 *
 * @returns {Date | string} property value
 */
function getPropertyValue(name, component) {
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
    attendees: e.attendees.map((a) => parseAttendee(a.jCal[1]), author, email),
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
  let mappedEvents = events.map((e) => ({
    endDate: e.endDate.toJSDate(),
    startDate: e.startDate.toJSDate(),
    ...commonEventProperties(e, author, email),
  }));
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
function mapOccurences(occurrences, author, email) {
  let mappedOccurrences = occurrences.map((o) => ({
    startDate: o.startDate.toJSDate(),
    endDate: o.endDate.toJSDate(),
    ...commonEventProperties(o.item, author, email),
  }));
  return mappedOccurrences;
}

/**
 * Create new org file from list of events
 *
 * @param {Object} config - configuration settings
 * @param {Array} events - array of event objects
 */
function createOrgFile(config, events) {
  const header = [
    `#+TITLE:       ${config.TITLE}\n`,
    `#+AUTHOR:      ${config.AUTHOR}\n`,
    `#+EMAIL:       ${config.EMAIL}\n`,
    "#+DESCRIPTION: converted using icsorg node script\n",
    `#+CATEGORY:    ${config.CATEGORY}\n`,
    `#+STARTUP:     ${config.STARTUP}\n`,
    `#+FILETAGS:    ${config.FILETAGS}\n`,
    "\n",
  ];

  try {
    let of = fs.createWriteStream(config.ORG_FILE, {
      encoding: "utf-8",
      flags: "w",
    });
    let rs = new Readable();
    header.forEach((h) => rs.push(h));
    events.forEach((e) => dumpEvent(e, rs));
    rs.push(null);
    rs.pipe(of);
  } catch (err) {
    throw new Error(`createOrgFile: ${err.message}`);
  }
}

/**
 * @async
 *
 * Retrieve event data from ICS source. This could be either a local file
 * or a URL which returns an .ics file (like Google).
 *
 * @param {string} source - either path to a local file or a URL which will return an .ics file
 *
 * @returns {string} The .ics data as a string
 */
async function getIcsData(source) {
  let data = "";

  try {
    if (source.startsWith("http")) {
      // assume source is a url
      let resp = await fetch(source);
      data = await resp.text();
    } else {
      // assume is a file name
      data = fs.readFileSync(source, "utf-8");
    }
    return data;
  } catch (err) {
    throw new Error(`getIcsData: ${err.message}`);
  }
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

  try {
    const config = {
      RC_FILE: RC,
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

    if (argv.p) {
      config.PAST = parseInt(argv.p);
    } else if (process.env.PAST) {
      config.PAST = parseInt(process.env.PAST);
    }

    if (argv.f) {
      config.FUTURE = parseInt(argv.f);
    } else if (process.env.FUTURE) {
      config.FUTURE = parseInt(process.env.FUTURE);
    }

    config.START_DATE = DateTime.now().minus({ days: config.PAST });
    config.END_DATE = DateTime.now().plus({ days: config.FUTURE });

    if (argv.dump) {
      dumpConfig(config);
    }

    let data = await getIcsData(config.ICS_FILE);
    const expander = new IcalExpander({ ics: data, maxIterations: 1000 });
    const events = expander.between(
      config.START_DATE.toJSDate(),
      config.END_DATE.toJSDate()
    );
    const mappedEvents = mapEvents(events.events, config.AUTHOR, config.EMAIL);
    const mappedOccurrences = mapOccurences(
      events.occurrences,
      config.AUTHOR,
      config.EMAIL
    );
    let allEvents = [...mappedEvents, ...mappedOccurrences];
    createOrgFile(config, allEvents);
    console.log(
      `Generated new org file in ${config.ORG_FILE} with ${allEvents.length} entries`
    );
  } catch (err) {
    throw new Error(`main: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(err.message);
});
