.PHONY: install db cli dev test clean

install:
	cd server && npm install
	cd web && npm install
	cd cli && go mod tidy

db:
	docker compose up -d

cli:
	cd cli && go build -o bin/relay main.go

dev:
	@echo "Use separate terminals for 'cd server && npm run dev' and 'cd web && npm run dev'"

test:
	cd cli && go test ./...

clean:
	docker compose down -v
	rm -rf cli/bin
	rm -rf server/node_modules web/node_modules
