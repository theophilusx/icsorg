"use strict";

const IcalExpander = require("ical-expander");
const fs = require("fs");
const { DateTime } = require("luxon");

const AUTHOR = "Tim Cross";
const EMAIL = "theophilusx@gmail.com";

const icsFile = process.argv[2];

const data = fs.readFileSync(icsFile, "utf-8");

const expander = new IcalExpander({ ics: data, maxIterations: 1000 });

const events = expander.between(
  new Date("2017-01-01T00:00:00"),
  new Date("2022-01-01T00:00:00")
);

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
  let date = DateTime.fromJSDate(dt);
  return date.toFormat(fmt, { locale: "au" });
}

function makeTimestampRange(start, end) {
  const fmt = "<yyyy-LL-dd ccc HH:mm>";
  const sDate = DateTime.fromJSDate(start);
  const eDate = DateTime.fromJSDate(end);
  return `${sDate.toFormat(fmt, { locale: "au" })}--${eDate.toFormat(fmt, {
    locale: "au",
  })}`;
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

function dumpEvent(e) {
  let data = [];
  data.push(`* ${e.summary}`);
  data.push(":PROPERTIES:");
  data.push(":ICAL_EVENT:    t");
  data.push(`:ID:            ${e.uid}`);
  data.push(`:ORGANIZER:     ${makeMailtoLink(e.organizer)}`);
  data.push(`:STATUS:        ${e.status}`);
  data.push(`:LAST_MODIFIED: ${makeTimestamp(e.modified, "inactive")}`);
  data.push(`:LOCATION:      ${e.location}`);
  data.push(`:DURATION:      ${parseDuration(e.duration)}`);
  data.push(
    `:ATTENDEES:  ${e.attendees
      .map((a) => `${makeMailtoLink(a.cn)} (${a.status})`)
      .join(", ")}`
  );
  data.push(":END:");
  data.push(makeTimestampRange(e.startDate, e.endDate));
  data.push(`\n${e.description}`);
  console.log(data.join("\n"));
}

function getPropertyValue(name, component) {
  let prop = component.getAllProperties(name)[0];
  if (prop) {
    return prop.getValues()[0];
  }
  return "";
}

const mappedEvents = events.events.map((e) => ({
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
  modified: new Date(getPropertyValue("last-modified", e.component)),
}));

const mappedOccurrences = events.occurrences.map((o) => ({
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

mappedEvents.forEach((e) => dumpEvent(e));
mappedOccurrences.forEach((e) => dumpEvent(e));
