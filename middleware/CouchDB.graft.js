// A quick test implementation to get something happening on the screen.
// a simple in-memory data adapter for tests.
var _      = require('underscore');
var Couch  = require('../lib/couch.js');
var crypto = require('crypto');

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
        var dfr = new $.Deferred();

        this.couch.get(getUrl(model, id), function(err, doc) {
            if (err) { return dfr.reject(404); }
            dfr.resolve(doc);
        });

        return dfr.promise();
    },
    createModel: function(model, data) {
        if (data.id === undefined) {
            data.id = crypto.createHash('md5').update(new Date().getTime().toString()).digest("hex");
        }

        var _doc = {
            _id: getUrl(model) + '/' + data.id
        };

        _.extend(_doc, data);

        return promisify(this.couch.post, _doc);
    },
    updateModel: function (model, id, data) {
        var dfr = new $.Deferred();

        var _doc = {
            _id : getUrl(model, id)
        };
        _.extend(_doc, data);

        this.couch.put(_doc, function(err, doc) {
            if (err) { return dfr.reject(404); }
            dfr.resolve({'_rev': doc.rev});
        });

        return dfr.promise();
    },
    deleteModel: function(model, id) {
        var dfr = new $.Deferred();
        var that = this;

        this.couch.get(getUrl(model, id), function(err, doc) {
            if (err) { return dfr.reject(404); }
            that.couch.del(doc, function(err, res) {
                err ? dfr.reject(404) : dfr.resolve({});
            });
        });
        return dfr.promise();
    },
    readCollection: function(col) {
        var dfr = new $.Deferred();
        var url = '_design/backbone/_rewrite' + getUrl(col);
        this.couch.view(url, {}, function(err, res) {
            if (err) { return dfr.reject(404); }
            var data = [];
            _.each(res.rows, function(val) {
                data.push(val.doc);
            });
            dfr.resolve(data);
        });
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
