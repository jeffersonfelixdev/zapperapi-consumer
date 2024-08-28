FROM node:20-alpine
WORKDIR /app
ENV RABBITMQ_URL=amqp://localhost:5672
ENV WA_INSTANCE=instance_
COPY . .
RUN npm ci --omit=dev
CMD ["node", "index.js"]
