# Stage 1: Build the application
# Use an official Node.js runtime as a parent image
FROM node:18 as builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if using Yarn)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build your app
#RUN npm run build
RUN npx remix build

# Stage 2: Setup the runtime environment
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/build /app/build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public /app/public

# Set the environment to production
ENV NODE_ENV production
# Set the dabase url to the production database
ENV DATABASE_URL file:./data.db

RUN npx prisma init --url file:./data.db
COPY prisma/schema.prisma prisma/
COPY prisma/seed.ts prisma/
RUN npx prisma db push
RUN npx tsx ./prisma/seed.ts

# Expose the port the app runs on
EXPOSE 3000

# Run your app
CMD ["npm", "start"]

