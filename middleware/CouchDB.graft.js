// A quick test implementation to get something happening on the screen.
// a simple in-memory data adapter for tests.
var request = require('request');
var url = require('url');
var _ = require('underscore');
var Couch = require('../lib/couch.js');
var crypto = require('crypto');
var Errors = {
    NOT_FOUND: {
        status: 404,
        message: "There is no such page"
    }
};

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

    fn.apply(this, args); 

    return dfr.promise();
}


function getUrl(model, id) {
    if (!id) { return '/api/' + model; }

    return '/api/'+model+'/'+id;
}

_.extend(this, {
    readModel: function(model, id) {
        // console.log('readModel :', model, id);
        return promisify(this.couch.get, getUrl(model, id));
    },
    createModel: function(model, data) {
        // console.log('createModel :', model, data);
        if(data.id == undefined)
            data.id = crypto.createHash('md5').update(new Date().getTime().toString()).digest("hex");

        var _doc = {
            _id: getUrl(model) + '/' + data.id
        }
        _.extend(_doc, data);

        return promisify(this.couch.post, _doc);
    },
    updateModel: function (model, id, data) {
        // console.log('updateModel :', model, id, data);
        var _doc = {
            _id : getUrl(model, id)
        }
        _.extend(_doc, data);

        return promisify(this.couch.put, _doc);
    },
    deleteModel: function(model, id) {
        // console.log('deleteModel :', model, id);
        var doc = this.readModel(model, id);
        return promisify(this.couch.delete, getUrl(model, doc));
    },
    readCollection: function(col) {
        // console.log('readCollection');
        debug('read collection ' + col);
        var dfr = new $.Deferred();
        this.testData[col] ? dfr.resolve(this.testData[col]) : dfr.reject(404);
        return dfr.promise();
    }
});

this.addInitializer(function(opts) {
    // console.log("addInitializer : ", opts);
    var opts = opts || {};

    this.couch = new Couch({
        pathname: opts.db || '/graft'
    });
});

this.addInitializer(function(opts) {
    // console.log("addInitializer adding handlers");
    debug("adding handler for reading models");
    Graft.reqres.setHandler('model:read', this.readModel, this);
    Graft.reqres.setHandler('model:create', this.createModel, this);
    Graft.reqres.setHandler('model:update', this.updateModel, this);
    Graft.reqres.setHandler('model:delete', this.deleteModel, this);
    Graft.reqres.setHandler('collection:read', this.readCollection, this);
});