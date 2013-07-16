REPORTER = spec

simple:
		@./node_modules/.bin/mocha \
			--reporter $(REPORTER) \
			--ui bdd \
			--bail \
			test/test.js

test: simple

.PHONY: test