var debug = require("debug")("merge-files")
var sendMessage = require("./send-message")
var util = require("util")
var getDriveFile = require("./get-drive-file")
var getSubs = require("./get-subs")
var formatSub = require("./format-sub")
var filterSubs = require("./filter-subs")
var organizeSubs = require("./organize-subs")
var _ = require("underscore")
var Promise = require("bluebird")
var moment = require("moment")
var fs = Promise.promisifyAll(require("fs"))
var csv = Promise.promisifyAll(require("csv"))
var getOauth2Client = require("./auth-client")
var google = require('googleapis')
//var argv = require('minimist')(process.argv.slice(2));

function search(){
  return getSubs().tap(function(){
    debug("fetched chargebee subs")
  }).then(function(subs){
    console.log(JSON.stringify(subs[0], undefined, 2))
  })
}

module.exports = search
