import { expect } from "chai";
import { createOrgFile } from "../../src/lib.js";
import { readFileSync, rmSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("createOrgFile", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "icsorg-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeConfig = (orgFile) => ({
    ORG_FILE: orgFile,
    TITLE: "Test Calendar",
    AUTHOR: "Test Author",
    EMAIL: "test@example.com",
    CATEGORY: "TEST",
    STARTUP: "overview",
    FILETAGS: ":test:",
  });

  const makeEvent = () => ({
    summary: "Test Event",
    uid: "test-uid-1@example.com",
    startDate: new Date("2024-01-15T10:00:00Z"),
    endDate: new Date("2024-01-15T11:00:00Z"),
    attendees: [],
    organizer: null,
    status: "CONFIRMED",
    modified: null,
    location: null,
    duration: null,
    description: null,
  });

  it("should return a Promise", () => {
    const orgFile = join(tmpDir, "test.org");
    const result = createOrgFile(makeConfig(orgFile), []);
    expect(result).to.be.instanceOf(Promise);
    return result;
  });

  it("should resolve Promise when file is fully written", async () => {
    const orgFile = join(tmpDir, "test.org");
    await createOrgFile(makeConfig(orgFile), [makeEvent()]);

    const contents = readFileSync(orgFile, "utf-8");
    expect(contents).to.include("#+TITLE:       Test Calendar");
    expect(contents).to.include("#+AUTHOR:      Test Author");
    expect(contents).to.include("* Test Event");
  });

  it("should reject Promise when output path is invalid", async () => {
    const orgFile = join(tmpDir, "nonexistent-dir", "test.org");
    try {
      await createOrgFile(makeConfig(orgFile), []);
      expect.fail("Should have thrown an error");
    } catch (err) {
      expect(err.message).to.include("createOrgFile");
    }
  });

  it("should write org file header with config values", async () => {
    const orgFile = join(tmpDir, "test.org");
    await createOrgFile(makeConfig(orgFile), []);

    const contents = readFileSync(orgFile, "utf-8");
    expect(contents).to.include("#+TITLE:       Test Calendar");
    expect(contents).to.include("#+AUTHOR:      Test Author");
    expect(contents).to.include("#+EMAIL:       test@example.com");
    expect(contents).to.include("#+CATEGORY:    TEST");
    expect(contents).to.include("#+STARTUP:     overview");
    expect(contents).to.include("#+FILETAGS:    :test:");
  });

  it("should write all events to file", async () => {
    const orgFile = join(tmpDir, "test.org");
    const events = [
      { ...makeEvent(), summary: "Event One", uid: "uid-1@example.com" },
      { ...makeEvent(), summary: "Event Two", uid: "uid-2@example.com" },
    ];
    await createOrgFile(makeConfig(orgFile), events);

    const contents = readFileSync(orgFile, "utf-8");
    expect(contents).to.include("* Event One");
    expect(contents).to.include("* Event Two");
  });
});
