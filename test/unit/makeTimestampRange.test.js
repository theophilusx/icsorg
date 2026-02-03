import { expect } from "chai";
import { makeTimestampRange } from "../../src/lib.js";

describe("makeTimestampRange", () => {
  it("should create timestamp range for same day events", () => {
    const start = new Date("2023-08-15T14:30:00");
    const end = new Date("2023-08-15T15:30:00");
    const result = makeTimestampRange(start, end);

    // Should be in format <YYYY-MM-DD Day HH:MM-HH:MM>
    expect(result).to.match(
      /^<\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}-\d{2}:\d{2}>$/,
    );
    expect(result).to.include("2023-08-15");
    expect(result).to.include("14:30");
    expect(result).to.include("15:30");
  });

  it("should create timestamp range for multi-day events", () => {
    const start = new Date("2023-08-15T14:30:00");
    const end = new Date("2023-08-16T15:30:00");
    const result = makeTimestampRange(start, end);

    // Should be in format <YYYY-MM-DD Day HH:MM>--<YYYY-MM-DD Day HH:MM>
    expect(result).to.match(
      /^<\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}>--<\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}>$/,
    );
    expect(result).to.include("2023-08-15");
    expect(result).to.include("2023-08-16");
  });

  it("should handle events spanning midnight", () => {
    const start = new Date("2023-08-15T23:00:00");
    const end = new Date("2023-08-16T01:00:00");
    const result = makeTimestampRange(start, end);

    // Different days, so should use double dash format
    expect(result).to.include("--");
    expect(result).to.include("23:00");
    expect(result).to.include("01:00");
  });

  it("should handle same day all-day format", () => {
    const start = new Date("2023-08-15T00:00:00");
    const end = new Date("2023-08-15T23:59:00");
    const result = makeTimestampRange(start, end);

    expect(result).to.include("2023-08-15");
    expect(result).to.include("00:00");
    expect(result).to.include("23:59");
  });

  it("should handle multi-day all-day events", () => {
    const start = new Date("2023-08-15T00:00:00");
    const end = new Date("2023-08-17T00:00:00");
    const result = makeTimestampRange(start, end);

    expect(result).to.include("--");
    expect(result).to.include("2023-08-15");
    expect(result).to.include("2023-08-17");
  });

  it("should format short meetings correctly", () => {
    const start = new Date("2023-08-15T10:00:00");
    const end = new Date("2023-08-15T10:30:00");
    const result = makeTimestampRange(start, end);

    expect(result).to.include("10:00");
    expect(result).to.include("10:30");
  });

  it("should handle full day event on same day", () => {
    const start = new Date("2023-08-15T09:00:00");
    const end = new Date("2023-08-15T17:00:00");
    const result = makeTimestampRange(start, end);

    expect(result).to.match(
      /^<\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}-\d{2}:\d{2}>$/,
    );
    expect(result).to.include("09:00");
    expect(result).to.include("17:00");
  });

  it("should include day abbreviations", () => {
    const start = new Date("2023-08-15T10:00:00");
    const end = new Date("2023-08-15T11:00:00");
    const result = makeTimestampRange(start, end);

    // Should contain 3-letter day abbreviation
    expect(result).to.match(/\w{3}/);
  });
});
