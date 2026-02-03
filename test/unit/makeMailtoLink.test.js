import { expect } from "chai";
import { makeMailtoLink } from "../../src/lib.js";

describe("makeMailtoLink", () => {
  it("should convert mailto: URL to org link", () => {
    const input = "mailto:test@example.com";
    const result = makeMailtoLink(input);

    expect(result).to.equal("[[mailto:test@example.com][test@example.com]]");
  });

  it("should convert plain email address to org link", () => {
    const input = "test@example.com";
    const result = makeMailtoLink(input);

    expect(result).to.equal("[[mailto:test@example.com][test@example.com]]");
  });

  it("should handle email with name in mailto URL", () => {
    const input = "mailto:john.doe@example.com";
    const result = makeMailtoLink(input);

    expect(result).to.equal(
      "[[mailto:john.doe@example.com][john.doe@example.com]]",
    );
  });

  it("should return non-email string unchanged", () => {
    const input = "Not an email";
    const result = makeMailtoLink(input);

    expect(result).to.equal("Not an email");
  });

  it("should return URL without @ unchanged", () => {
    const input = "https://example.com";
    const result = makeMailtoLink(input);

    expect(result).to.equal("https://example.com");
  });

  it("should handle null input", () => {
    const result = makeMailtoLink(null);

    expect(result).to.be.null;
  });

  it("should handle undefined input", () => {
    const result = makeMailtoLink(undefined);

    expect(result).to.be.undefined;
  });

  it("should handle empty string", () => {
    const result = makeMailtoLink("");

    expect(result).to.equal("");
  });

  it("should handle email with subdomain", () => {
    const input = "user@mail.example.com";
    const result = makeMailtoLink(input);

    expect(result).to.equal(
      "[[mailto:user@mail.example.com][user@mail.example.com]]",
    );
  });

  it("should handle email with numbers", () => {
    const input = "user123@example.com";
    const result = makeMailtoLink(input);

    expect(result).to.equal(
      "[[mailto:user123@example.com][user123@example.com]]",
    );
  });

  it("should handle email with special characters", () => {
    const input = "user.name+tag@example.com";
    const result = makeMailtoLink(input);

    expect(result).to.equal(
      "[[mailto:user.name+tag@example.com][user.name+tag@example.com]]",
    );
  });

  it("should handle string with @ but not an email", () => {
    const input = "Check @ symbol";
    const result = makeMailtoLink(input);

    // Should still create a link because it contains @
    expect(result).to.equal("[[mailto:Check @ symbol][Check @ symbol]]");
  });
});
