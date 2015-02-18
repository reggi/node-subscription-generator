var dotty = require("dotty")
var moment = require("moment")
var _ = require("underscore")

_.mixin({
  flag: function(items, message, fn){
    return _.map(items, function(item){
      var condition = fn(item)
      if(!item.error) item.error = []
      if(!condition) item.error.push(message)
      return item
    })
  }
})

function filterSubs(start, end){
  return function(subscriptions){
    return _.chain(subscriptions)
      .flag("filter status", function(subscription) {
        var status = subscription.subscription.status
        var invalidStatuses = ["cancelled", "future"]
        return (!_.contains(invalidStatuses, status))
      })
      .flag("filter date", function(subscription) {
        if(!start) return true
        if(!dotty.exists(subscription, "subscription.created_at")) return false
        var createdAt = subscription.subscription.created_at
        var startDate = moment(createdAt, "X")
        var isAfter = startDate.isAfter(start)
        var isBefore = startDate.isBefore(end)
        return (isAfter && isBefore)
      })
      .flag("invalid shipping", function(subscription){
        return (dotty.exists(subscription, "subscription.shipping_address.country"))
      })
      .flag("invalid country", function(subscription){
        if(!dotty.exists(subscription, "subscription.shipping_address.country")) return true
        var country = subscription.subscription.shipping_address.country
        return (_.contains(["US", "CA"], country))
      })
      .value()
  }
}

module.exports = filterSubs
