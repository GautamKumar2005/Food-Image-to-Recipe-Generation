FROM node:18-alpine

WORKDIR /app

# Install dependencies based on package-lock if present, else just npm install
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build the Next.js app 
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
