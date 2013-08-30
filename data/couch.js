// A quick test implementation to get something happening on the screen.
// a simple in-memory data adapter for tests.
var _      = require('underscore');
var async  = require('async');
var glob   = require('glob');
var Couch  = require('../lib/couch');
var crypto = require('crypto');


function getUrl(model, id) {
    if (!id) { return '/api/' + model; }

    return '/api/'+model+'/'+id;
}

_.extend(this, {
    readModel: function(name, model, id) {
        var dfr = new _.Deferred();

        this.couch.get(getUrl(name, id), function(err, doc) {
            if (err) { return dfr.reject(404); }
            dfr.resolve(doc);
        });

        return dfr.promise();
    },
    createModel: function(name, model, data) {
        var dfr = new _.Deferred();
        if (data.id === undefined) {
            data.id = crypto.createHash('md5').update(new Date().getTime().toString()).digest("hex");
        }

        var _doc = {
            _id: getUrl(name) + '/' + data.id
        };

        _.extend(_doc, data);

        this.couch.post(_doc, function(err, doc) {
            doc.id = doc.id.replace('/api/'+ name +'/', '');
            if (err) { return dfr.reject(404); }
            dfr.resolve({'_rev': doc.rev, id: doc.id});
        });

        return dfr.promise();
    },
    updateModel: function (name, model, id, data) {
        var dfr = new _.Deferred();

        var _doc = {
            _id : getUrl(name, id)
        };
        _.extend(_doc, data);

        this.couch.put(_doc, function(err, doc) {
            if (err) { return dfr.reject(404); }
            dfr.resolve({'_rev': doc.rev});
        });

        return dfr.promise();
    },
    deleteModel: function(name, model, id) {
        var dfr = new _.Deferred();
        var that = this;

        this.couch.get(getUrl(name, id), function(err, doc) {
            if (err) { return dfr.reject(404); }
            that.couch.del(doc, function(err, res) {
                err ? dfr.reject(404) : dfr.resolve({});
            });
        });
        return dfr.promise();
    },
    readCollection: function(name, col) {
        var dfr = new _.Deferred();
        var url = '_design/backbone/_rewrite' + getUrl(name);
        this.couch.view(url, {}, function(err, res) {
            if (err) { return dfr.reject(404); }
            var data = [];
            _.each(res.rows, function(val) {
                data.push(val.doc);
            });
            dfr.resolve(data);
        });
        return dfr.promise();
    },
    setupData: function(opts) {

        Graft.Data.reqres.setHandler('read', this.readModel, this);
        Graft.Data.reqres.setHandler('create', this.createModel, this);
        Graft.Data.reqres.setHandler('update', this.updateModel, this);
        Graft.Data.reqres.setHandler('delete', this.deleteModel, this);
        Graft.Data.reqres.setHandler('query', this.readCollection, this);
        this.installDatabase(opts);
    },
    installDatabase: function(opts) {
        // console.log("addInitializer : ", opts);
        var opts = opts || {};
        var that = this;
        var couch = this.couch = new Couch({
            pathname: opts.db || '/graft'
        });

        var files = glob.sync(__dirname + '/../design-docs/*.json');

        function checkExists(next) {
            couch.dbExists(function(err, body) {
                if (err && (err.statusCode === 404)) {
                    debug('Database %s does not exist. Creating', couch.name);
                    next(null);
                } else {
                    next('database exists');
                }
            });
        }

        async.series([
            checkExists,
            couch.dbPut.bind(couch),
            couch.putDesignDocs.bind(couch, files)
        ], function(err, res) {
            debug('Created Database, Added View');
            that.trigger('ready');
        });

    }
});

this.addInitializer(function(opts) {
    // console.log("addInitializer adding handlers");
    debug("adding handler for reading models");
    Graft.Data.commands.setHandler('setup', this.setupData, this);
});
