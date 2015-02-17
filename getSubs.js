var _ = require("underscore")
var Promise = require("bluebird")
var chargebee = require("chargebee")

chargebee.configure({
  site : process.env.CHARGEBEE_SITE,
  api_key : process.env.CHARGEBEE_API_KEY
});

function getSet(offset){
  var opts = {}
  opts.limit = 100
  if(offset) opts.offset = offset
  return new Promise(function(resolve, reject) {
    chargebee.subscription
    .list(opts)
    .request(function(err, value){
      if(err) return reject(err)
      return resolve(value)
    })
  })
}

function getAll(){
  var subscriptions = []
  function inception(data){
    if(!data) return getSet().then(inception)
    if(data && data.list) subscriptions.push(data.list)
    if(data && data.next_offset) return getSet(data.next_offset).then(inception)
    if(data && !data.next_offset) return _.flatten(subscriptions)
  }
  return Promise.resolve(inception(false))
}

module.exports = getAll
