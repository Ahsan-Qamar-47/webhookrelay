# Contributing to Webhook Relay

Thank you for your interest in contributing to Webhook Relay! This document provides guidelines and instructions for setting up your development environment, submitting pull requests, and adhering to project standards.

---

## 🚀 Development Environment Setup

### Prerequisites
- **Go**: v1.24+
- **Node.js**: v22+
- **Docker & Docker Compose** (for PostgreSQL 16 & Redis 7)

### Local Repository Setup

```bash
# 1. Clone the repository
git clone https://github.com/Ahsan-Qamar-47/webhookrelay.git
cd webhookrelay

# 2. Install all dependencies across monorepo packages
make install

# 3. Start local Postgres 16 and Redis 7 database containers
make db

# 4. Execute database SQL migrations & seed data
cd server && npm run db:migrate && npm run db:seed && cd ..

# 5. Build the Go CLI binary
make cli
```

---

## 🧪 Testing & Verification

Before submitting a Pull Request, run all linters and test suites locally:

```bash
# Run CLI formatting and Go unit tests
cd cli && go vet ./... && go test -v ./... && cd ..

# Run Server ESLint and Node.js integration tests
cd server && npm run lint && npm test && cd ..

# Unified test command
make test
```

---

## 🎨 Code Style & Formatting Guidelines

- **Go CLI**: Code must pass `gofmt -l cli/` with zero formatting differences and pass `go vet ./...`.
- **Node Server & Web**: Code must pass ESLint (`npm run lint`).
- **Error Handling**: Use standard error formats (`{ success: false, error: { code, message, details } }`).

---

## 📝 Git Commit Message Standards

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope)`: New feature or capability
- `fix(scope)`: Bug fix
- `docs(scope)`: Documentation update
- `test(scope)`: Unit or integration test additions
- `refactor(scope)`: Code refactoring without functionality changes

*Example*:
```text
feat(cli): add --verbose flag and slog file logging
```

---

## 🔀 Pull Request Process

1. Create a feature branch off `main`: `git checkout -b feature/your-feature-name`.
2. Ensure all unit and integration tests pass cleanly (`make test`).
3. Commit your changes using conventional commit messages.
4. Push to your fork and submit a Pull Request describing your changes.
