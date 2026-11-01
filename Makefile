all: node_modules
	npm test
	npm run htmlhint
	npm run stylelint

node_modules:
	npm install
