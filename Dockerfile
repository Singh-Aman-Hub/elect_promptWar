FROM node:20-alpine
WORKDIR /app/server

# Copy package files and install only production dependencies
COPY server/package*.json ./
RUN npm install --production

# Copy server source code
COPY server/ ./

# Copy built frontend from local build
COPY client/dist /app/client/dist

# Configure environment for production
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the server
CMD ["node", "index.js"]
