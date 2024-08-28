import 'dotenv/config'

import amqp from 'amqplib'
import { randomInt } from 'node:crypto'

async function consumer() {
  console.info('Starting Consumer for instance', process.env.WA_INSTANCE)
  const connection = await amqp.connect(process.env.RABBITMQ_URL)
  const channel = await connection.createChannel()
  channel.prefetch(1)
  await channel.assertExchange(process.env.WA_INSTANCE, 'topic', {
    durable: true,
  })
  const { queue } = await channel.assertQueue(process.env.WA_INSTANCE, {
    durable: true,
  })
  await channel.bindQueue(queue, process.env.WA_INSTANCE, 'messages')
  await channel.consume(queue, async data => {
    if (data) {
      const { id, method, url, body, apikey, query } = JSON.parse(
        data.content.toString(),
      )
      const fullUrl =
        `${url}/wa_instance` +
        (query ? '?' + new URLSearchParams(query).toString() : '')
      const res = await fetch(fullUrl, {
        method,
        body,
        headers: {
          'Content-Type': 'application/json',
          apikey,
        },
      })
      const response = await res.json()
      channel.publish(
        'events',
        'instance.response',
        Buffer.from(
          JSON.stringify({
            response: {
              id,
              instance: process.env.WA_INSTANCE,
              data: response,
            },
          }),
        ),
      )
      await sleep(15000 + randomInt(15000))
      channel.ack(data)
    }
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Start Consumer
consumer()
