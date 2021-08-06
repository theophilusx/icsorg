"use strict";

const { Readable } = require("stream");
const IcalExpander = require("ical-expander");
const fs = require("fs");
const { DateTime } = require("luxon");
const argv = require("minimist")(process.argv.slice(2));

const RC = argv.c || `${process.env.HOME}/.icsorgrc`;
require("dotenv").config({ path: RC });

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

function dumpConfig() {
  const config = [
    `RC File = ${RC}`,
    `AUTHOR = ${AUTHOR}`,
    `EMAIL = ${EMAIL}`,
    `ICS_FILE = ${ICS_FILE}`,
    `ORG_FILE = ${ORG_FILE}`,
    `TITLE = ${TITLE}`,
    `CATEGORY = ${CATEGORY}`,
    `STARTUP = ${STARTUP}`,
    `FILETAGS = ${FILETAGS}`,
    `PAST = ${past}`,
    `FUTURE = ${future}`,
    `Start Date = ${startDate}`,
    `End Date = ${endDate}`,
  ];
  console.log(config.join("\n"));
  process.exit(0);
}

function parseAttendee(data) {
  return {
    category: data.category,
    role: data.role,
    status: data.partstat,
    cn: data.cn,
    guests: data["x-num-guests"],
    me: data.cn === AUTHOR || data.cn === EMAIL ? true : false,
  };
}

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

function makeMailtoLink(email) {
  if (email && email.startsWith("mailto:")) {
    let addr = email.substring(7);
    return `[[${email}][${addr}]]`;
  } else if (email && email.includes("@")) {
    return `[[mailto:${email}][${email}]]`;
  }
  return email;
}

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

function getPropertyValue(name, component) {
  let prop = component.getFirstProperty(name);
  if (prop) {
    switch (prop.getDefaultType()) {
      case "text":
        return prop.getFirstValue();
      case "date-time":
        let val = prop.getFirstValue();
        return val.toJSDate();
      default:
        return prop.getFirstValue().toString();
    }
  }
  return "";
}

function mapEvents(events) {
  let mappedEvents = events.map((e) => ({
    attendees: e.attendees.map((a) => parseAttendee(a.jCal[1])),
    description: e.description,
    duration: e.duration,
    endDate: e.endDate.toJSDate(),
    location: e.location,
    organizer: e.organizer,
    recurrenceId: e.recurrenceId,
    sequence: e.sequence,
    startDate: e.startDate.toJSDate(),
    summary: e.summary,
    uid: e.uid,
    status: getPropertyValue("status", e.component),
    modified: getPropertyValue("last-modified", e.component),
  }));
  return mappedEvents;
}

function mapOccurences(occurrences) {
  let mappedOccurrences = occurrences.map((o) => ({
    recurrenceId: o.recurrenceId,
    startDate: o.startDate.toJSDate(),
    endDate: o.endDate.toJSDate(),
    summary: o.item.summary,
    description: o.item.description,
    duration: o.item.duration,
    attendees: o.item.attendees.map((a) => parseAttendee(a.jCal[1])),
    location: o.item.location,
    organizer: o.item.organizer,
    uid: o.item.uid,
    status: getPropertyValue("status", o.item.component),
    modified: getPropertyValue("last-modified", o.item.component),
  }));
  return mappedOccurrences;
}

function createOrgFile(fileName, events) {
  const header = [
    `#+TITLE:       ${TITLE}\n`,
    `#+AUTHOR:      ${AUTHOR}\n`,
    `#+EMAIL:       ${EMAIL}\n`,
    "#+DESCRIPTION: converted using icsorg node script\n",
    `#+CATEGORY:    ${CATEGORY}\n`,
    `#+STARTUP:     ${STARTUP}\n`,
    `#+FILETAGS:    ${FILETAGS}\n`,
    "\n",
  ];

  try {
    let of = fs.createWriteStream(fileName, { encoding: "utf-8", flags: "w" });
    let rs = new Readable();
    header.forEach((h) => rs.push(h));
    events.forEach((e) => dumpEvent(e, rs));
    rs.push(null);
    rs.pipe(of);
  } catch (err) {
    throw new Error(`createOrgFile: ${err.message}`);
  }
}

if (argv.h || argv.help) {
  doHelp();
}

const ICS_FILE = argv.i || process.env.ICS_FILE;
const ORG_FILE = argv.o || process.env.ORG_FILE;
const TITLE = process.env.TITLE || "Calendar";
const AUTHOR = argv.a || process.env.AUTHOR;
const EMAIL = argv.e || process.env.EMAIL;
const CATEGORY = process.env.CATEGORY;
const STARTUP = process.env.STARTUP;
const FILETAGS = process.env.FILETAGS;

let past = 7;
let future = 365;

if (argv.p) {
  past = parseInt(argv.p);
} else if (process.env.PAST) {
  past = parseInt(process.env.PAST);
}

if (argv.f) {
  future = parseInt(argv.f);
} else if (process.env.FUTURE) {
  future = parseInt(process.env.FUTURE);
}

const startDate = DateTime.now().minus({ days: past });
const endDate = DateTime.now().plus({ days: future });

if (argv.dump) {
  dumpConfig();
}

const data = fs.readFileSync(ICS_FILE, "utf-8");

const expander = new IcalExpander({ ics: data, maxIterations: 1000 });

const events = expander.between(startDate.toJSDate(), endDate.toJSDate());

const mappedEvents = mapEvents(events.events);
const mappedOccurrences = mapOccurences(events.occurrences);
let allEvents = [...mappedEvents, ...mappedOccurrences];
createOrgFile(ORG_FILE, allEvents);
