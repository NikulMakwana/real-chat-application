# Build stage
FROM node:18-alpine AS builder

# Create and set working directory
WORKDIR /app

# First copy ONLY package files for efficient caching
COPY project-root/package*.json ./

# Install dependencies
RUN npm install

# Copy all other files
COPY project-root/. ./

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
