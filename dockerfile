# Use a lightweight Node.js base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock/package-lock.json
COPY package*.json ./
# If you use yarn:
# COPY yarn.lock ./

# Install dependencies
RUN npm install --omit=dev
# If you use yarn:
# RUN yarn install --production

# Copy source code
COPY . .

# Build NestJS application
RUN npm run build
# If you use yarn:
# RUN yarn build

# --- Production stage ---
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy necessary artifacts from the build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Expose the port your NestJS app listens on (default is 3000)
EXPOSE 8080

# Command to run your NestJS application
CMD [ "npm", "run", "start:prod" ]