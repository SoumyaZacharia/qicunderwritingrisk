# --- Build Stage ---
FROM node:20-alpine AS build

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first.
# This leverages Docker's build cache: if dependencies haven't changed,
# npm install won't be re-run.
COPY package*.json ./

# **THIS IS THE CRITICAL LINE:**
# Install ALL dependencies (including devDependencies) for the build process.
# This ensures `@nestjs/cli` is available for `nest build`.
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the NestJS application for production
# Now `nest` command should be found as @nestjs/cli is installed
RUN npm run build

# --- Production Stage (remains the same as before) ---
FROM node:20-alpine AS production

WORKDIR /app

# Copy only production-necessary artifacts from the build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

EXPOSE 3000

CMD [ "npm", "run", "start:prod" ]
