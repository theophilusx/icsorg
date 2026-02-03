import { expect } from "chai";
import { parseConfig } from "../../src/lib.js";

describe("parseConfig", () => {
  // Store original env vars
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  it("should parse config with command line arguments", () => {
    const argv = {
      i: "input.ics",
      o: "output.org",
      a: "Test Author",
      e: "test@example.com",
      p: 14,
      f: 180,
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.ICS_FILE).to.equal("input.ics");
    expect(config.ORG_FILE).to.equal("output.org");
    expect(config.AUTHOR).to.equal("Test Author");
    expect(config.EMAIL).to.equal("test@example.com");
    expect(config.PAST).to.equal(14);
    expect(config.FUTURE).to.equal(180);
    expect(config.RC_FILE).to.equal("/home/user/.icsorgrc");
  });

  it("should use environment variables when CLI args not provided", () => {
    process.env.ICS_FILE = "env-input.ics";
    process.env.ORG_FILE = "env-output.org";
    process.env.AUTHOR = "Env Author";
    process.env.EMAIL = "env@example.com";
    process.env.PAST = "30";
    process.env.FUTURE = "90";

    const argv = {};
    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.ICS_FILE).to.equal("env-input.ics");
    expect(config.ORG_FILE).to.equal("env-output.org");
    expect(config.AUTHOR).to.equal("Env Author");
    expect(config.EMAIL).to.equal("env@example.com");
    expect(config.PAST).to.equal(30);
    expect(config.FUTURE).to.equal(90);
  });

  it("should prioritize CLI args over environment variables", () => {
    process.env.ICS_FILE = "env-input.ics";
    process.env.ORG_FILE = "env-output.org";

    const argv = {
      i: "cli-input.ics",
      o: "cli-output.org",
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.ICS_FILE).to.equal("cli-input.ics");
    expect(config.ORG_FILE).to.equal("cli-output.org");
  });

  it("should use default values for optional parameters", () => {
    const argv = {
      i: "input.ics",
      o: "output.org",
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.TITLE).to.equal("Calendar");
    expect(config.PAST).to.equal(7);
    expect(config.FUTURE).to.equal(365);
  });

  it("should calculate START_DATE and END_DATE", () => {
    const argv = {
      i: "input.ics",
      o: "output.org",
      p: 10,
      f: 30,
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.START_DATE).to.exist;
    expect(config.END_DATE).to.exist;
    expect(config.START_DATE.toJSDate()).to.be.a("date");
    expect(config.END_DATE.toJSDate()).to.be.a("date");
  });

  it("should handle optional fields from environment", () => {
    process.env.TITLE = "My Calendar";
    process.env.CATEGORY = "EVENTS";
    process.env.STARTUP = "overview";
    process.env.FILETAGS = ":calendar:";

    const argv = {
      i: "input.ics",
      o: "output.org",
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.TITLE).to.equal("My Calendar");
    expect(config.CATEGORY).to.equal("EVENTS");
    expect(config.STARTUP).to.equal("overview");
    expect(config.FILETAGS).to.equal(":calendar:");
  });

  it("should parse string numbers to integers for PAST", () => {
    const argv = {
      i: "input.ics",
      o: "output.org",
      p: "15",
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.PAST).to.equal(15);
    expect(config.PAST).to.be.a("number");
  });

  it("should parse string numbers to integers for FUTURE", () => {
    const argv = {
      i: "input.ics",
      o: "output.org",
      f: "200",
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.FUTURE).to.equal(200);
    expect(config.FUTURE).to.be.a("number");
  });

  it("should handle zero values for PAST and FUTURE", () => {
    const argv = {
      i: "input.ics",
      o: "output.org",
      p: 0,
      f: 0,
    };

    const config = parseConfig(argv, "/home/user/.icsorgrc");

    expect(config.PAST).to.equal(0);
    expect(config.FUTURE).to.equal(0);
  });
});
