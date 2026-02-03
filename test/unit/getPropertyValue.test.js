import { expect } from "chai";
import { getPropertyValue } from "../../src/lib.js";

describe("getPropertyValue", () => {
  it("should return text property value", () => {
    const mockComponent = {
      getFirstProperty: (name) => {
        if (name === "summary") {
          return {
            getDefaultType: () => "text",
            getFirstValue: () => "Test Event",
          };
        }
        return null;
      },
    };

    const result = getPropertyValue("summary", mockComponent);

    expect(result).to.equal("Test Event");
  });

  it("should return date-time property value as JS Date", () => {
    const testDate = new Date("2023-08-15T14:30:00");
    const mockComponent = {
      getFirstProperty: (name) => {
        if (name === "dtstart") {
          return {
            getDefaultType: () => "date-time",
            getFirstValue: () => ({
              toJSDate: () => testDate,
            }),
          };
        }
        return null;
      },
    };

    const result = getPropertyValue("dtstart", mockComponent);

    expect(result).to.deep.equal(testDate);
  });

  it("should return default type property as string", () => {
    const mockComponent = {
      getFirstProperty: (name) => {
        if (name === "custom") {
          return {
            getDefaultType: () => "custom-type",
            getFirstValue: () => ({
              toString: () => "Custom Value",
            }),
          };
        }
        return null;
      },
    };

    const result = getPropertyValue("custom", mockComponent);

    expect(result).to.equal("Custom Value");
  });

  it("should return empty string for non-existent property", () => {
    const mockComponent = {
      getFirstProperty: (name) => null,
    };

    const result = getPropertyValue("nonexistent", mockComponent);

    expect(result).to.equal("");
  });

  it("should handle status property", () => {
    const mockComponent = {
      getFirstProperty: (name) => {
        if (name === "status") {
          return {
            getDefaultType: () => "text",
            getFirstValue: () => "CONFIRMED",
          };
        }
        return null;
      },
    };

    const result = getPropertyValue("status", mockComponent);

    expect(result).to.equal("CONFIRMED");
  });

  it("should handle last-modified property", () => {
    const testDate = new Date("2023-08-01T10:00:00");
    const mockComponent = {
      getFirstProperty: (name) => {
        if (name === "last-modified") {
          return {
            getDefaultType: () => "date-time",
            getFirstValue: () => ({
              toJSDate: () => testDate,
            }),
          };
        }
        return null;
      },
    };

    const result = getPropertyValue("last-modified", mockComponent);

    expect(result).to.deep.equal(testDate);
  });

  it("should handle multiple property lookups", () => {
    const mockComponent = {
      getFirstProperty: (name) => {
        if (name === "summary") {
          return {
            getDefaultType: () => "text",
            getFirstValue: () => "Event Title",
          };
        } else if (name === "location") {
          return {
            getDefaultType: () => "text",
            getFirstValue: () => "Conference Room",
          };
        }
        return null;
      },
    };

    const summary = getPropertyValue("summary", mockComponent);
    const location = getPropertyValue("location", mockComponent);

    expect(summary).to.equal("Event Title");
    expect(location).to.equal("Conference Room");
  });
});
