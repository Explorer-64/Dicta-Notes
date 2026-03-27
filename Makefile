install-backend:
	chmod +x frontend/backend/install.sh
	chmod +x frontend/backend/run.sh
	cd frontend/backend && ./install.sh

install-frontend:
	chmod +x frontend/install.sh
	chmod +x frontend/run.sh
	cd frontend && ./install.sh

install: install-backend install-frontend

run-backend:
	cd frontend/backend && ./run.sh

run-frontend:
	cd frontend && ./run.sh

deploy:
	chmod +x deploy.sh
	./deploy.sh

.DEFAULT_GOAL := install
