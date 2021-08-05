"use strict";

const IcalExpander = require("ical-expander");
const fs = require("fs");

const AUTHOR = "Tim Cross";
const EMAIL = "theophilusx@gmail.com";

const icsFile = process.argv[2];

const data = fs.readFileSync(icsFile, "utf-8");

const expander = new IcalExpander({ ics: data, maxIterations: 100 });

const events = expander.between(
  new Date("2021-01-01T00:00:00"),
  new Date("2021-10-01T00:00:00")
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

const mappedEvents = events.events.map((e) => ({
  attendees: e.attendees.map((a) => parseAttendee(a.jCal[1])),
  description: e.description,
  //duration: e.duration,
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
}));

//const mappedOccurances = events.occurrences.map((e) => Object.keys(e));

mappedEvents.map((e) => {
  console.log(`* ${e.summary}`);
  console.log(":PROPERTIES:");
  console.log(":ICAL_EVENT: t");
  console.log(`:ID:         ${e.uid}`);
  console.log(`:ORGANIZER:  ${e.organizer}`);
  console.log(`:LOCATION:   ${e.location}`);
  console.log(":END:");
  console.log(`Start: ${e.startDate}`);
  console.log(`End: ${e.endDate}`);
  console.log(
    `Attendees: ${e.attendees
      .map((a) => `${a.cn} ${a.status} Guests: ${a.guests}`)
      .join("\n           ")}`
  );
  console.log(`Description: ${e.description}`);
  console.log("=================================");
});

// mappedOccurances.map((e) => {
//   console.log(e);
// });

// events.events.map((e) => {
//   console.dir(e);
//   console.log("=========================");
// });
