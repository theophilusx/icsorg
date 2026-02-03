import { expect } from "chai";
import { parseDuration } from "../../src/lib.js";

describe("parseDuration", () => {
  it("should format duration with weeks and days", () => {
    const duration = {
      weeks: 2,
      days: 3,
      hours: 4,
      minutes: 30,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("2 wk 3 d 04:30 hh:mm");
  });

  it("should format duration with only days", () => {
    const duration = {
      days: 5,
      hours: 2,
      minutes: 15,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("5 d 02:15 hh:mm");
  });

  it("should format duration with only hours and minutes", () => {
    const duration = {
      hours: 3,
      minutes: 45,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("03:45 hh:mm");
  });

  it("should pad single digit hours correctly", () => {
    const duration = {
      hours: 5,
      minutes: 30,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("05:30 hh:mm");
  });

  it("should pad single digit minutes correctly", () => {
    const duration = {
      hours: 10,
      minutes: 5,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("10:05 hh:mm");
  });

  it("should handle zero values correctly", () => {
    const duration = {
      hours: 0,
      minutes: 0,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("00:00 hh:mm");
  });

  it("should handle 1 day duration", () => {
    const duration = {
      days: 1,
      hours: 0,
      minutes: 0,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("1 d 00:00 hh:mm");
  });

  it("should handle weeks with no days", () => {
    const duration = {
      weeks: 1,
      days: 0,
      hours: 12,
      minutes: 30,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("1 wk 0 d 12:30 hh:mm");
  });

  it("should handle duration with maximum time values", () => {
    const duration = {
      hours: 23,
      minutes: 59,
    };

    const result = parseDuration(duration);

    expect(result).to.equal("23:59 hh:mm");
  });
});
