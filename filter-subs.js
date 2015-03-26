var dotty = require("dotty")
var moment = require("moment")
var _ = require("underscore")

_.mixin({
  flag: function(items, keyword, fn){
    return _.map(items, function(item){
      var condition = fn(item)
      if(!item.keywords) item.keywords = []
      if(!condition) item.keywords.push(keyword)
      return item
    })
  }
})

function checkUp(collection, nestedArrString, options){
  var keywords = dotty.get(collection, nestedArrString)
  var cases = []
  //console.log(keywords)
  //console.log(options)
  _.each(options.include, function(containThis){
    cases.push(_.contains(keywords, containThis))
  })
  _.each(options.exclude, function(doesNoteContainThis){
    cases.push(!_.contains(keywords, doesNoteContainThis))
  })
  //console.log(cases)
  cases = _.without(cases, true)
  cases = cases.length !== 0
  //console.log("will return "+ cases)
  return cases
}

function filterSubs(start, end){
  start = (start && !moment.isMoment(start)) ? moment(start, "YYMMDD") : start
  end = (end && !moment.isMoment(end)) ? moment(end, "YYMMDD") : end
  var invalidStatuses = ["cancelled", "future"]
  return function(subscriptions){
    var flagedSubscriptions = _.chain(subscriptions)
      .flag("all", function(subscription) {
        return false
      })
      .flag("invalid status", function(subscription) {
        return (!_.contains(invalidStatuses, subscription.subscription.status))
      })
      .flag("invalid date", function(subscription) {
        if(!start || !end) return true // true, return it not invalid date
        if(!dotty.exists(subscription, "subscription.created_at")) return false
        var startDate = moment(subscription.subscription.created_at, "X")
        var isAfter = startDate.isAfter(start)
        var isBefore = startDate.isBefore(end)
        return (isAfter && isBefore)
      })
      .flag("no shipping country", function(subscription){
        return (dotty.exists(subscription, "subscription.shipping_address.country"))
      })
      .flag("invalid shipping country", function(subscription){
        if(!dotty.exists(subscription, "subscription.shipping_address.country")) return true
        var country = subscription.subscription.shipping_address.country
        return (_.contains(["US", "CA"], country))
      })
      .flag("kickstarter", function(subscription){
        return (subscription.customer.cf_reference !== "kickstarter")
      })
      .flag("valid", function(subscription){
        return checkUp(subscription, "keywords", {
          exclude: [
            "invalid status",
            "invalid date",
            "no shipping country",
            "invalid shipping country"
          ]
        })
      })
      .flag("valid kickstarter", function(subscription){
        return checkUp(subscription, "keywords", {
          include: [
            "kickstarter",
            "valid"
          ]
        })
      })
      .flag("valid not kickstarter", function(subscription){
        return checkUp(subscription, "keywords", {
          include: [
            "valid"
          ],
          exclude: [
            "kickstarter"
          ]
        })
      })
      .flag("active invalid shipping", function(subscription){
        return checkUp(subscription, "keywords", {
          include: [
            "no shipping country",
            "invalid shipping country"
          ],
          exclude: [
            "invalid status",
            "invalid date",
          ]
        })
      })
      .value()

    // index by each flag

    // get each flag

    var flags = _.chain(subscriptions).map(function(subscription){
      return subscription.keywords
    }).flatten().unique().value()

    var indexByFlag = _.object(_.map(flags, function(flag){
      var hasFlag = _.filter(flagedSubscriptions, function(sub){
        return _.contains(sub.keywords, flag)
      })
      return [flag, hasFlag]
    }))

    return indexByFlag

  }
}

module.exports = filterSubs
