import { expect } from "chai";
import { makeTimestamp } from "../../src/lib.js";

describe("makeTimestamp", () => {
  it("should create an active timestamp by default", () => {
    const date = new Date("2023-08-15T14:30:00");
    const result = makeTimestamp(date);

    // The format should be <YYYY-MM-DD Day HH:MM>
    expect(result).to.match(/^<\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}>$/);
    expect(result).to.include("2023-08-15");
    expect(result).to.include("14:30");
  });

  it("should create an active timestamp when explicitly specified", () => {
    const date = new Date("2023-08-15T14:30:00");
    const result = makeTimestamp(date, "active");

    expect(result).to.match(/^<\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}>$/);
    expect(result).to.include("2023-08-15");
  });

  it("should create an inactive timestamp", () => {
    const date = new Date("2023-08-15T14:30:00");
    const result = makeTimestamp(date, "inactive");

    // The format should be [YYYY-MM-DD Day HH:MM]
    expect(result).to.match(/^\[\d{4}-\d{2}-\d{2} \w{3} \d{2}:\d{2}\]$/);
    expect(result).to.include("2023-08-15");
    expect(result).to.include("14:30");
  });

  it("should return empty string for null date", () => {
    const result = makeTimestamp(null);

    expect(result).to.equal("");
  });

  it("should return empty string for undefined date", () => {
    const result = makeTimestamp(undefined);

    expect(result).to.equal("");
  });

  it("should format midnight correctly", () => {
    const date = new Date("2023-08-15T00:00:00");
    const result = makeTimestamp(date);

    expect(result).to.include("00:00");
  });

  it("should format end of day correctly", () => {
    const date = new Date("2023-08-15T23:59:00");
    const result = makeTimestamp(date);

    expect(result).to.include("23:59");
  });

  it("should handle single digit hours", () => {
    const date = new Date("2023-08-15T09:30:00");
    const result = makeTimestamp(date);

    expect(result).to.include("09:30");
  });

  it("should handle single digit minutes", () => {
    const date = new Date("2023-08-15T14:05:00");
    const result = makeTimestamp(date);

    expect(result).to.include("14:05");
  });

  it("should include day of week abbreviation", () => {
    const date = new Date("2023-08-15T14:30:00");
    const result = makeTimestamp(date);

    // Should contain a 3-letter day abbreviation
    expect(result).to.match(/\w{3}/);
  });
});
