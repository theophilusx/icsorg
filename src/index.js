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
  new Date("2020-01-01T00:00:00"),
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
  if (d.weeks) {
    return `${d.weeks} week(s), ${d.days} day(s) and ${d.hours} hour(s) ${d.minutes} minutes`;
  } else if (d.days) {
    return `${d.days} day(s) and ${d.hours} hour(s) ${d.minutes} minutes`;
  } else {
    return `${d.hours < 10 ? `0${d.hours}` : `${d.hours}`}:${
      d.minutes < 10 ? `0${d.minutes}` : `${d.minutes}`
    }`;
  }
}

function makeTimestamp(start, end) {
  const fmt = "<yyyy-LL-dd ccc HH:mm>";
  const sDate = DateTime.fromJSDate(start);
  const eDate = DateTime.fromJSDate(end);
  return `${sDate.toFormat(fmt, { locale: "au" })}--${eDate.toFormat(fmt, {
    locale: "au",
  })}`;
}

const mappedEvents = events.events.map((e) => ({
  attendees: e.attendees.map((a) => parseAttendee(a.jCal[1])),
  description: e.description,
  duration: e.duration,
  endDate: e.endDate.toJSDate(),
  //exceptions: e.exceptions,
  location: e.location,
  organizer: e.organizer,
  recurrenceId: e.recurrenceId,
  sequence: e.sequence,
  startDate: e.startDate.toJSDate(),
  //strictExceptions: e.strictExceptions,
  summary: e.summary,
  uid: e.uid,
  status: e.status,
}));

const mappedOccurrences = events.occurrences.map((o) => ({
  recurrenceId: o.recurrenceId,
  startDate: o.startDate.toJSDate(),
  endDate: o.endDate.toJSDate(),
  summary: o.item.summary,
  duration: o.item.duration,
  attendees: o.item.attendees.map((a) => parseAttendee(a.jCal[1])),
  location: o.item.location,
  organizer: o.item.organizer,
  uid: o.item.uid,
  item: Object.keys(o.item),
}));

mappedEvents.map((e) => {
  console.log(`* ${e.summary}`);
  console.log(":PROPERTIES:");
  console.log(":ICAL_EVENT: t");
  console.log(`:ID:         ${e.uid}`);
  console.log(`:ORGANIZER:  ${e.organizer}`);
  console.log(`:LOCATION:   ${e.location}`);
  console.log(`:DURATION:   ${parseDuration(e.duration)}`);
  console.log(
    `:ATTENDEES:  ${e.attendees.map((a) => `${a.cn} (${a.status})`).join(", ")}`
  );
  console.log(":END:");
  console.log(makeTimestamp(e.startDate, e.endDate));
  console.log(`\nStatus: ${e.status}`);
  console.log(`\nDescription: ${e.description}`);
  console.log("=================================");
});

mappedOccurrences.map((o) => console.dir(o));
