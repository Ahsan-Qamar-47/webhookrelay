# Webhook Relay

[![Go CLI CI](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/cli.yml/badge.svg)](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/cli.yml)
[![Node.js Server CI](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/server.yml/badge.svg)](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/server.yml)
[![React Web CI](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/web.yml/badge.svg)](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/web.yml)

A full-stack application to receive webhooks and tunnel them to local environments.

## CI/CD Status

Continuous Integration is configured via GitHub Actions for all monorepo components:
- **Go CLI (`cli/**`)**: Formatted check (`gofmt`), static analysis (`go vet`), unit tests with race detection (`go test -race`), and build artifact generation.
- **Node.js Server (`server/**`)**: Service container integration (Postgres 16 & Redis 7), ESLint checks (`npm run lint`), and unit test suite (`npm test`).
- **React Web Dashboard (`web/**`)**: ESLint checks (`npm run lint`) and production build verification (`npm run build`).

## Requirements

- Go 1.26+
- Node.js 24+
- Docker Desktop / Compose

## Setup

Run `make install` and `make db`.
