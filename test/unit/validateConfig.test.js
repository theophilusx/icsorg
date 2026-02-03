import { expect } from "chai";
import { validateConfig } from "../../src/lib.js";
import { DateTime } from "luxon";

describe("validateConfig", () => {
  it("should pass validation with all required fields", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: 7,
      FUTURE: 365,
      START_DATE: DateTime.now(),
      END_DATE: DateTime.now(),
    };

    expect(() => validateConfig(config)).to.not.throw();
  });

  it("should throw error when ICS_FILE is missing", () => {
    const config = {
      ORG_FILE: "output.org",
      PAST: 7,
      FUTURE: 365,
    };

    expect(() => validateConfig(config)).to.throw(
      /Missing required ICS_FILE parameter/,
    );
  });

  it("should throw error when ORG_FILE is missing", () => {
    const config = {
      ICS_FILE: "input.ics",
      PAST: 7,
      FUTURE: 365,
    };

    expect(() => validateConfig(config)).to.throw(
      /Missing required ORG_FILE parameter/,
    );
  });

  it("should throw error when both ICS_FILE and ORG_FILE are missing", () => {
    const config = {
      PAST: 7,
      FUTURE: 365,
    };

    expect(() => validateConfig(config)).to.throw(
      /Configuration validation failed/,
    );
    expect(() => validateConfig(config)).to.throw(/Missing required ICS_FILE/);
    expect(() => validateConfig(config)).to.throw(/Missing required ORG_FILE/);
  });

  it("should throw error when PAST is negative", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: -5,
      FUTURE: 365,
    };

    expect(() => validateConfig(config)).to.throw(/Invalid PAST value/);
  });

  it("should throw error when FUTURE is negative", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: 7,
      FUTURE: -100,
    };

    expect(() => validateConfig(config)).to.throw(/Invalid FUTURE value/);
  });

  it("should throw error when PAST is NaN", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: NaN,
      FUTURE: 365,
    };

    expect(() => validateConfig(config)).to.throw(/Invalid PAST value/);
  });

  it("should throw error when FUTURE is NaN", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: 7,
      FUTURE: NaN,
    };

    expect(() => validateConfig(config)).to.throw(/Invalid FUTURE value/);
  });

  it("should accept zero values for PAST and FUTURE", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: 0,
      FUTURE: 0,
    };

    expect(() => validateConfig(config)).to.not.throw();
  });

  it("should provide helpful error messages", () => {
    const config = {
      PAST: -5,
      FUTURE: -10,
    };

    try {
      validateConfig(config);
      expect.fail("Should have thrown an error");
    } catch (err) {
      expect(err.message).to.include("Configuration validation failed");
      expect(err.message).to.include("Missing required ICS_FILE");
      expect(err.message).to.include("Specify with -i option");
      expect(err.message).to.include("Missing required ORG_FILE");
      expect(err.message).to.include("Specify with -o option");
      expect(err.message).to.include("Invalid PAST value");
      expect(err.message).to.include("Invalid FUTURE value");
    }
  });

  it("should accept optional fields as undefined", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: 7,
      FUTURE: 365,
      AUTHOR: undefined,
      EMAIL: undefined,
      CATEGORY: undefined,
    };

    expect(() => validateConfig(config)).to.not.throw();
  });

  it("should accept large values for PAST and FUTURE", () => {
    const config = {
      ICS_FILE: "input.ics",
      ORG_FILE: "output.org",
      PAST: 1000,
      FUTURE: 10000,
    };

    expect(() => validateConfig(config)).to.not.throw();
  });
});
