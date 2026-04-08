const test = require("node:test");
const assert = require("node:assert/strict");

const { createCompositeEventStore } = require("../services/stores/event-store");

test("composite event store keeps primary reads and fans out writes", async () => {
  const calls = [];
  const primaryStore = {
    async appendBatch(events) {
      calls.push(["primary", events.length]);
      return { written: events.length };
    },
    readAll() {
      return [{ event_name: "page_view" }];
    },
  };
  const secondaryStore = {
    async appendBatch(events) {
      calls.push(["secondary", events.length]);
      return { written: events.length };
    },
  };

  const store = createCompositeEventStore({ primaryStore, secondaryStores: [secondaryStore] });
  const result = await store.appendBatch([{ event_name: "page_view" }, { event_name: "click" }], {});

  assert.equal(result.written, 2);
  assert.deepEqual(store.readAll(), [{ event_name: "page_view" }]);
  assert.deepEqual(calls, [["primary", 2], ["secondary", 2]]);
});
