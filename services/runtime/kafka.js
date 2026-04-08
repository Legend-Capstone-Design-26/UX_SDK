const { Kafka, logLevel } = require("kafkajs");

function createKafkaRuntime({ brokers, clientId }) {
  let producerPromise = null;

  async function getProducer() {
    if (!producerPromise) {
      producerPromise = (async () => {
        const kafka = new Kafka({
          clientId,
          brokers,
          logLevel: logLevel.NOTHING,
        });
        const producer = kafka.producer();
        await producer.connect();
        return producer;
      })().catch((error) => {
        producerPromise = null;
        throw error;
      });
    }
    return producerPromise;
  }

  async function publishBatch({ topic, messages }) {
    const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
    if (list.length === 0) return { sent: 0 };
    const producer = await getProducer();
    await producer.send({ topic, messages: list });
    return { sent: list.length };
  }

  async function disconnect() {
    if (!producerPromise) return;
    const producer = await producerPromise;
    await producer.disconnect();
    producerPromise = null;
  }

  return {
    publishBatch,
    disconnect,
  };
}

module.exports = { createKafkaRuntime };
