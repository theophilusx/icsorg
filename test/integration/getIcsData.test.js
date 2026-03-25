import { expect } from "chai";
import { getIcsData } from "../../src/lib.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("getIcsData (Integration)", () => {
  const fixturePath = join(__dirname, "..", "fixtures", "sample.ics");
  let fixtureContents;

  before(async () => {
    fixtureContents = await getIcsData(fixturePath);
  });

  it("should read ICS data from local file", () => {
    expect(fixtureContents).to.be.a("string");
    expect(fixtureContents).to.include("BEGIN:VCALENDAR");
    expect(fixtureContents).to.include("END:VCALENDAR");
    expect(fixtureContents).to.include("Test Meeting");
  });

  it("should return complete ICS file content", () => {
    expect(fixtureContents).to.include("test-event-1@example.com");
    expect(fixtureContents).to.include("test-event-2@example.com");
    expect(fixtureContents).to.include("test-event-3@example.com");
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

  it("should return identical content to direct file read", () => {
    const directRead = readFileSync(fixturePath, "utf-8");
    expect(fixtureContents).to.equal(directRead);
  });

  it("should handle file with event descriptions", () => {
    expect(fixtureContents).to.include(
      "DESCRIPTION:This is a test event for unit testing",
    );
    expect(fixtureContents).to.include("DESCRIPTION:Another test event");
  });

  it("should throw error with HTTP status for non-2xx response", async () => {
    const { createServer } = await import("http");
    const server = createServer((_req, res) => {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();

    try {
      await getIcsData(`http://127.0.0.1:${port}/calendar.ics`);
      expect.fail("Should have thrown an error");
    } catch (err) {
      expect(err.message).to.include("HTTP 404");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("should handle file with attendees", () => {
    expect(fixtureContents).to.include("ATTENDEE");
    expect(fixtureContents).to.include("john.doe@example.com");
    expect(fixtureContents).to.include("jane.smith@example.com");
  });

  it("should preserve all ICS properties", () => {
    expect(fixtureContents).to.include("DTSTART");
    expect(fixtureContents).to.include("DTEND");
    expect(fixtureContents).to.include("SUMMARY");
    expect(fixtureContents).to.include("LOCATION");
    expect(fixtureContents).to.include("ORGANIZER");
    expect(fixtureContents).to.include("STATUS");
  });
});
