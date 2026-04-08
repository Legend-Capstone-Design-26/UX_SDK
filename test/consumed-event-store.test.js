const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { createConsumedEventStore } = require("../services/stores/consumed-event-store");

test("consumed event store appends and reads records", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ux-sdk-consumed-"));
  const file = path.join(dir, "events.consumed.jsonl");
  const store = createConsumedEventStore({ consumedEventsFile: file });

  store.append({ offset: "1", event: { event_name: "page_view" } });
  const all = store.readAll();

  assert.equal(all.length, 1);
  assert.equal(all[0].event.event_name, "page_view");
});
