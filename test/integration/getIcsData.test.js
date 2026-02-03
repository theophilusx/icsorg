import { expect } from "chai";
import { getIcsData } from "../../src/lib.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("getIcsData (Integration)", () => {
  it("should read ICS data from local file", async () => {
    const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
    const result = await getIcsData(fixturePath);

    expect(result).to.be.a("string");
    expect(result).to.include("BEGIN:VCALENDAR");
    expect(result).to.include("END:VCALENDAR");
    expect(result).to.include("Test Meeting");
  });

  it("should return complete ICS file content", async () => {
    const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
    const result = await getIcsData(fixturePath);

    // Should contain all three test events
    expect(result).to.include("test-event-1@example.com");
    expect(result).to.include("test-event-2@example.com");
    expect(result).to.include("test-event-3@example.com");
  });

  it("should throw error for non-existent file", async () => {
    const nonExistentPath = join(
      __dirname,
      "..",
      "fixtures",
      "nonexistent.ics",
    );

    try {
      await getIcsData(nonExistentPath);
      expect.fail("Should have thrown an error");
    } catch (err) {
      expect(err.message).to.include("getIcsData");
    }
  });

  it("should parse file with correct encoding", async () => {
    const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
    const result = await getIcsData(fixturePath);
    const directRead = readFileSync(fixturePath, "utf-8");

    expect(result).to.equal(directRead);
  });

  it("should handle file with event descriptions", async () => {
    const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
    const result = await getIcsData(fixturePath);

    expect(result).to.include(
      "DESCRIPTION:This is a test event for unit testing",
    );
    expect(result).to.include("DESCRIPTION:Another test event");
  });

  it("should handle file with attendees", async () => {
    const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
    const result = await getIcsData(fixturePath);

    expect(result).to.include("ATTENDEE");
    expect(result).to.include("john.doe@example.com");
    expect(result).to.include("jane.smith@example.com");
  });

  it("should preserve all ICS properties", async () => {
    const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
    const result = await getIcsData(fixturePath);

    // Check for important ICS properties
    expect(result).to.include("DTSTART");
    expect(result).to.include("DTEND");
    expect(result).to.include("SUMMARY");
    expect(result).to.include("LOCATION");
    expect(result).to.include("ORGANIZER");
    expect(result).to.include("STATUS");
  });
});
