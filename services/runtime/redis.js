const Redis = require("ioredis");

function createRedisRuntime({ url, keyPrefix }) {
  let client = null;

  function getClient() {
    if (!client) {
      client = new Redis(url, {
        lazyConnect: true,
        keyPrefix: keyPrefix ? `${keyPrefix}:` : undefined,
        maxRetriesPerRequest: 1,
      });
    }
    return client;
  }

  async function connect() {
    const redis = getClient();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    return redis;
  }

  async function disconnect() {
    if (!client) return;
    await client.quit();
    client = null;
  }

  return {
    connect,
    disconnect,
  };
}

module.exports = { createRedisRuntime };
