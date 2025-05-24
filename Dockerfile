# Stage 1: Build the application
FROM node:24-alpine as builder

WORKDIR /app

# Copy package files and install dependencies (including dev dependencies)
COPY package*.json ./
RUN npm install

# Copy the TypeScript configuration and source files
COPY tsconfig.json ./
COPY src ./src

# Build the project (output goes to the "dist" folder)
RUN npm run build

# Stage 2: Create the production container
FROM node:24-alpine

WORKDIR /app

# Receive the port from build arguments (with a default value)
ARG PORT=9087

# Copy only the necessary runtime files from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose the port defined by the build argument
EXPOSE ${PORT}

# Command to run your app
CMD ["node", "dist/index.js"]