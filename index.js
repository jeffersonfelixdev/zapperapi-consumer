import 'dotenv/config'

import amqp from 'amqplib'
import { randomInt } from 'node:crypto'

async function consumer() {
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
      const { id, method, url, body, apikey } = JSON.parse(
        data.content.toString(),
      )
      const res = await fetch(`${url}/wa_instance`.toString(), {
        method,
        body,
        headers: {
          'Content-Type': 'application/json',
          apikey,
        },
      })
      const response = await res.json()
      console.log(id, JSON.stringify(response, null, 2))
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
