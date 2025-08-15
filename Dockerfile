# Ultra-simple Dockerfile (put this in your project root)
FROM nginx:alpine
COPY client /usr/share/nginx/html
EXPOSE 80
