### a very simple whatsapp API gateway

#### how to run

- copy `.env.example` to `.env`
- setup `API_KEY`, `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD`
- run `docker build -t whatsapp-api .`
- run `docker run -d -p 8000:8000 whatsapp-api`