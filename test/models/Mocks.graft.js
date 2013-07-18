module.exports = Backbone.Collection.extend({
    url: '/api/Mock',
    model: Graft.$models.Mock
});