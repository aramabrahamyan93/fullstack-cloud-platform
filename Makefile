up:
	docker compose up --build

up-d:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

backend-logs:
	docker compose logs -f backend

db-logs:
	docker compose logs -f postgres

ps:
	docker compose ps

test:
	docker compose run --rm backend pytest

restart:
	docker compose down
	docker compose up --build

clean:
	docker compose down -v