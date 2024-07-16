# SPOTAPI

Spotify API proxy server

## Installation

```bash
yarn # or npm install
```

note: if you want to run this on docker, run build and kindly fill out required fields inside [docker-compose](./docker-compose.yaml).

## Scripts

| Script     | Description                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| build      | build project                                                                    |
| start      | start (must build first)                                                         |
| start:dev  | start on development mode (uses swc)                                             |
| start:prod | start on production mode (set `NODE_ENV` to `production` and run `start` script) |
| format     | format codes (prettier)                                                          |
