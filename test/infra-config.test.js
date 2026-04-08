const test = require("node:test");
const assert = require("node:assert/strict");

const { parseBoolean } = require("../services/runtime/infra-config");

test("parseBoolean handles common env flag forms", () => {
  assert.equal(parseBoolean("true"), true);
  assert.equal(parseBoolean("1"), true);
  assert.equal(parseBoolean("yes"), true);
  assert.equal(parseBoolean("false"), false);
  assert.equal(parseBoolean("0"), false);
  assert.equal(parseBoolean("", true), true);
});
