FROM node:20-alpine
WORKDIR /app
ENV RABBITMQ_URL=amqp://localhost:5672
ENV WA_INSTANCE=instance_
ENV EVOLUTION_API_URL=http://localhost:8080
COPY . .
RUN npm ci --omit=dev
CMD node index.js
