var _ = require("underscore")

function assignDefault(subscription){
  var defaults = {
    "subscription":{
      "id": "",
      "shipping_address":{
        "first_name": "",
        "last_name": "",
        "company": "",
        "line1": "",
        "line2": "",
        "line3": "",
        "city": "",
        "state": "",
        "country": "",
        "zip": ""
      },
    },
    "customer":{
      "cf_gift_from": ""
    }
  }
  subscription.subscription.shipping_address = _.defaults(subscription.subscription.shipping_address, defaults.subscription.shipping_address)
  subscription.customer = _.defaults(subscription.customer, defaults.customer)
  return subscription
}

function formatSub(subscription){
  var format = {}
  subscription = assignDefault(subscription)
  format['addresses.first_name'] = subscription.subscription.shipping_address.first_name
  format['addresses.last_name'] = subscription.subscription.shipping_address.last_name
  format['addresses.company'] = subscription.subscription.shipping_address.company
  format['addresses.addr'] = subscription.subscription.shipping_address.line1
  format['addresses.extended_addr'] = subscription.subscription.shipping_address.line2
  format['addresses.extended_addr2'] = subscription.subscription.shipping_address.line3
  format['addresses.city'] = subscription.subscription.shipping_address.city
  format['addresses.state'] = subscription.subscription.shipping_address.state
  format['addresses.country'] = subscription.subscription.shipping_address.country
  format['addresses.zip'] = subscription.subscription.shipping_address.zip
  format['customers.cf_gift_from'] = subscription.customer.cf_gift_from
  format['subscription.id'] = subscription.subscription.id
  return format
}

module.exports = formatSub
