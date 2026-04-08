const { appendJsonl, readJsonl } = require("../data-store");

function createConsumedEventStore({ consumedEventsFile }) {
  function append(record) {
    appendJsonl(consumedEventsFile, record);
    return { ok: true };
  }

  function readAll() {
    return readJsonl(consumedEventsFile);
  }

  return {
    append,
    readAll,
  };
}

module.exports = { createConsumedEventStore };
