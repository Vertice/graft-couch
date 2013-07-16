var should = require('should');
var request = require('request');
var utils = require('./utils');
var testPort = 12400;

// TODO maybe move this to 'before' script
// before script must create couch db and maybe create some new docs there
// after script must remove couchdb
// all test must be independent (don't use results of previous test in next one!)
var Graft = require('graftjs/server');
require('graftjs/middleware/REST.graft.js');
require('../middleware/CouchDB.graft.js');
Graft.load(__dirname);
Graft.start({db: 'ws_mocks'});

describe('Reading model', function() {
	describe('GET /api/Mock/one', function() {
		before(utils.requestUrl(testPort, '/api/Mock/one'));

		it ('should return status 200', function() {
            this.resp.should.have.status(200);
        });

        it('response should be json', function() {
            this.resp.should.be.json;
        });

        it ('should have a body', function() {
            should.exist(this.body);
        });

        it('should have the correct id', function() {
            this.body.should.have.property('id', 'one');
        });

        it ('should respect the default values', function() {
            this.body.should.have.property('name', 'name');
        });
	});
});