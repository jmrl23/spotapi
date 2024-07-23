# SPOTAPI

Spotify API proxy server

## Installation

```bash
yarn # or npm install
```

#### Note

if you want to run this on docker, kindly fill out required environment variables at [docker-compose](./docker-compose.yaml).

## Scripts

| Script     | Description                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| build      | build project                                                                    |
| start      | start (must build first)                                                         |
| start:dev  | start on development mode (uses swc)                                             |
| start:prod | start on production mode (set `NODE_ENV` to `production` and run `start` script) |
| format     | format codes (prettier)                                                          |
