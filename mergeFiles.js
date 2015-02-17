var util = require("util")
var getDriveFile = require("./getDriveFile")
var getSubs = require("./getSubs")
var formatSub = require("./formatSub")
var filterSubs = require("./filterSubs")
var organizeSubs = require("./organizeSubs")
var _ = require("underscore")
var Promise = require("bluebird")
var moment = require("moment")
var fs = Promise.promisifyAll(require("fs"))
var csv = Promise.promisifyAll(require("csv"))

function mergeFiles(token){
  return Promise.props({
    "custom fabian": getDriveFile(token, process.env.GOOGLE_DRIVE_FABIAN_DOC)
      .then(function(file){
        return csv.parseAsync(file, {columns: true})
      }),
    "custom mike": getDriveFile(token, process.env.GOOGLE_DRIVE_MIKE_DOC)
      .then(function(file){
        return csv.parseAsync(file, {columns: true})
      }),
    "chargebee": getSubs()
      .then(filterSubs)
      .then(organizeSubs)
  }).then(function(files){
    var counts = {}
    counts["custom fabian"] = _.size(files["custom fabian"])
    counts["custom mike"] = _.size(files["custom mike"])
    _.each(files["chargebee"], function(val, key){
      counts["chargebee "+key] = _.size(val)
    })
    counts["complete total"] = 0
    counts["complete total"] += counts["custom fabian"]
    counts["complete total"] += counts["custom mike"]
    counts["complete total"] += counts["chargebee valid"]
    files.counts = counts
    return files
  })
}

module.exports = mergeFiles
