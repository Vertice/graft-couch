// A quick test implementation to get something happening on the screen.
// a simple in-memory data adapter for tests.
var request = require('request');
var url = require('url');
var _ = require('underscore');
var Couch = require('../lib/couch.js');


function promisify(fn) {
    var dfr = new $.Deferred();

    function cb(err) {
        if (err) { return dfr.resolve(err); }

        var args = _.toArray(arguments);
        args.shift();
        dfr.resolve.apply(this, args);
    }

    var args = _.toArray(arguments);
    var fn = args.shift();
    args.push(cb);

    console.log(args);
    fn.apply(this, args); 

    return dfr.promise();
}

function getUrl(model, id) {
    if (!id) { return '/api/' + model; }

    return '/api/'+model+'/'+id;
}

_.extend(this, {
    readModel: function readModel(model, id) {
        debug('readModel :', model);
        return promisify(this.couch.get, getUrl(model, id));
    },
    updateModel: function readModel(model, id, data) {
        debug('updateModel :', model, id);
        var _doc = {
            _id : getUrl(model, id)
        }
        _.extend(_doc, data);

        return promisify(this.couch.put, _doc);
    },
    createModel: function(model, data) {
        debug('createModel :', model, data);
        var _doc = {
        }
        _.extend(_doc, data);

        return promisify(this.couch.put, _doc);
    },
    deleteModel: function(model, id) {
        var dfr = new $.Deferred();

        function deleteModel(m) {
            var ind = _(this.testData[model]).indexOf(m);
            this.testData[model].splice(ind, 1);

            dfr.resolve(204);
        }

        this.findModel(model, id).then(_.bind(deleteModel, this), dfr.reject);
        return dfr.promise();
    },
    readCollection: function readModel(col) {
        debug('read collection ' + col);
        var dfr = new $.Deferred();
        this.testData[col] ? dfr.resolve(this.testData[col]) : dfr.reject(404);
        return dfr.promise();
    }
});

this.addInitializer(function(opts) {
    var opts = opts || {};

    this.couch = new Couch({
        pathname: opts.db || '/graft'
    });


});

this.addInitializer(function(opts) {
    debug("adding handler for reading models");
    Graft.reqres.setHandler('model:read', this.readModel, this);
    Graft.reqres.setHandler('model:update', this.updateModel, this);
    Graft.reqres.setHandler('model:create', this.createModel, this);
    Graft.reqres.setHandler('model:delete', this.deleteModel, this);
    Graft.reqres.setHandler('collection:read', this.readCollection, this);
});

