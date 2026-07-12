FROM node:24-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Remove the env file and replace it with the server env
RUN rm -f .env
RUN mv .server.env .env

# Set environment variables (available during build and runtime)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Build the prisma data
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# Expose the default port
EXPOSE 3000

# Run the next start command to serve the application
CMD ["npm", "run", "start"]
