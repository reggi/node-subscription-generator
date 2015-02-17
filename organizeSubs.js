var _ = require("underscore")

module.exports = organizeSubs

function filterError(subscriptions, error){
  return _.filter(subscriptions, function(subscription){
    return _.contains(subscription.error, error)
  })
}

function filterErrorSeverity(subscriptions, error){
  return _.filter(subscriptions, function(subscription){
    var important1 = _.contains(subscription.error, "filter status")
    var important2 = _.contains(subscription.error, "filter date")
    var moderate = _.contains(subscription.error, error)
    var important = (important1 || important2)
    return !important && moderate
  })
}

function organizeSubs(subscriptions){
  return {
    "all": subscriptions,
    "valid": _.filter(subscriptions, function(subscription){
      return !subscription.error.length
    }),
    "filter status": filterError(subscriptions, "filter status"),
    "filter date": filterError(subscriptions, "filter date"),
    "mod invalid shipping": filterError(subscriptions, "invalid shipping"),
    "mod invalid country": filterError(subscriptions, "invalid country"),
    "invalid shipping": filterErrorSeverity(subscriptions, "invalid shipping"),
    "invalid country": filterErrorSeverity(subscriptions, "invalid country"),
  }
}
