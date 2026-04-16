# 1) Basimage med Node (Next.js behöver Node för att bygga och köra)
FROM node:20-alpine

# 2) Allt i containern kommer ligga i /app
WORKDIR /app

# 3) Kopiera bara package-filer först (så Docker kan cacha npm install)
COPY package*.json ./

# 4) Installera dependencies
RUN npm ci

# 5) Kopiera resten av koden
COPY . .

# 6) Bygg Next.js (skapar .next/)
RUN npm run build

# 7) Next.js lyssnar på 3000 som standard
EXPOSE 3000

# 8) Starta servern (kräver att package.json har "start": "next start")
CMD ["npm", "start"]
