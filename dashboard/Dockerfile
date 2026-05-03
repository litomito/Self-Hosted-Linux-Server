FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache bash curl git docker-cli docker-cli-compose

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start", "--", "-H", "0.0.0.0"]
