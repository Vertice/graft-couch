module.exports = Backbone.Model.extend({
    urlRoot: '/api/Mock',
    defaults: {
    	name: "name",
    	someVal: Math.random()
    }
});