var request = require('request');
var path    = require('path');
var Couch   = require('../lib/couch.js');
var _       = require('underscore');
var testUrl = 'http://localhost:';

function parseBody() {
    try {
        this.body = JSON.parse(this.body);
    } catch (e) {
        should.fail(null, null, 'not valid json');
    }
}

function requestUrl(port, pathname, method, body) {
    return function(done) {
        var self = this;
        var opts = {};
        opts.method = method || 'GET';

        opts.json = body || true;

        request(testUrl + port + pathname, opts, function(err, resp, body) {
            self.resp = resp;
            self.body = body;
            done(err);
        });
    };
}

// Set up database, populate with design documents.
var install = function(config, options, callback) {
    var db = new Couch(config);
    if (_(options).isFunction()) {
        callback = options;
        options = {};
    }
    options = _(options || {}).defaults({
        doc: path.resolve(__dirname + '/../design-docs/backbone.json')
    });
    db.dbPut(function(err) {
        if (err) return callback(err);
        db.putDesignDocs([options.doc], callback);
    });
};

module.exports = {
    parseBody: parseBody,
    requestUrl: requestUrl,
    install: install
};
