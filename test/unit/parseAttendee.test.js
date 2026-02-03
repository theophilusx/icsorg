import { expect } from "chai";
import { parseAttendee } from "../../src/lib.js";

describe("parseAttendee", () => {
  it("should correctly parse attendee data", () => {
    const testData = {
      category: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat: "ACCEPTED",
      cn: "test@example.com",
      "x-num-guests": 2,
    };

    const result = parseAttendee(testData, "Test User", "test@example.com");

    expect(result).to.deep.equal({
      category: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      status: "ACCEPTED",
      cn: "test@example.com",
      guests: 2,
      me: true,
    });
  });

  it("should identify attendee as 'me' when cn matches author", () => {
    const testData = {
      category: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat: "ACCEPTED",
      cn: "John Doe",
    };

    const result = parseAttendee(testData, "John Doe", "john@example.com");

    expect(result.me).to.be.true;
  });

  it("should identify attendee as 'me' when cn matches email", () => {
    const testData = {
      category: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat: "ACCEPTED",
      cn: "john@example.com",
    };

    const result = parseAttendee(testData, "John Doe", "john@example.com");

    expect(result.me).to.be.true;
  });

  it("should identify attendee as not 'me' when cn doesn't match", () => {
    const testData = {
      category: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat: "ACCEPTED",
      cn: "jane@example.com",
    };

    const result = parseAttendee(testData, "John Doe", "john@example.com");

    expect(result.me).to.be.false;
  });

  it("should handle missing optional fields", () => {
    const testData = {
      category: "INDIVIDUAL",
      role: "OPT-PARTICIPANT",
      partstat: "TENTATIVE",
      cn: "optional@example.com",
    };

    const result = parseAttendee(testData, "Test User", "test@example.com");

    expect(result).to.deep.equal({
      category: "INDIVIDUAL",
      role: "OPT-PARTICIPANT",
      status: "TENTATIVE",
      cn: "optional@example.com",
      guests: undefined,
      me: false,
    });
  });

  it("should handle different participation statuses", () => {
    const statuses = ["ACCEPTED", "DECLINED", "TENTATIVE", "DELEGATED"];

    statuses.forEach((status) => {
      const testData = {
        category: "INDIVIDUAL",
        role: "REQ-PARTICIPANT",
        partstat: status,
        cn: "test@example.com",
      };

      const result = parseAttendee(testData, "Test User", "test@example.com");

      expect(result.status).to.equal(status);
    });
  });
});
