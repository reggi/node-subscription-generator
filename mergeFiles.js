var debug = require("debug")("mergeFiles")
var sendMessage = require("./sendMessage")
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
var getOauth2Client = require("./oauth2Client")
var google = require('googleapis')
//var argv = require('minimist')(process.argv.slice(2));

function mergeFiles(flag){
  debug("readying to generate: %s", flag)

  if(flag == "welcome-kit"){
    var kitData = require("./welcomekit.json")
    var latest = _.last(kitData)
    var start = moment(latest.end, "YYMMDD").add(1, "day")
    var end = moment().subtract(1, "day")
    if (start.format("YYMMDD") == end.format("YYMMDD")){
      throw new Error("datespan is same day")
    }else if (start.isAfter(end)){
      throw new Error("start is after end")
    }
    kitData.push({
      "start": start.format("YYMMDD"),
      "end": end.format("YYMMDD")
    })
    fs.writeFileAsync("./welcomekit.json", JSON.stringify(kitData, undefined, 2), "utf8").then(function(){
      debug("updated welcomekit.json")
    })
  }else if(flag == "subscription"){
    var start = false
    var end = false
  }

  function upload(drive, title, body){
    debug("uploading file '%s' to google drive", title)
    drive.files = Promise.promisifyAll(drive.files)
    return drive.files.insertAsync({
      convert: true,
      resource: {
        title: title,
        mimeType: 'text/csv',
        parents: [{"id":process.env.GOOGLE_DRIVE_UPLOAD_PARENT_ID}],
      },
      media: {
        mimeType: 'text/csv',
        body: body,
      }
    }).spread(function(data, response){
      return data
    })
  }

  return getOauth2Client().then(function(oauth2Client){
    var accessToken = oauth2Client.credentials.access_token
    debug("retrieved google drive access token")
    var drive = google.drive({ version: 'v2', auth: oauth2Client });
    return Promise.props({
      "custom fabian": getDriveFile(accessToken, process.env.GOOGLE_DRIVE_FABIAN_DOC)
        .then(function(file){
          debug("fetched google drive 'custom fabian' doc")
          return csv.parseAsync(file, {columns: true})
        }),
      "custom mike": getDriveFile(accessToken, process.env.GOOGLE_DRIVE_MIKE_DOC)
        .then(function(file){
          debug("fetched google drive 'custom mike' doc")
          return csv.parseAsync(file, {columns: true})
        }),
      "chargebee": getSubs().tap(function(){
          debug("fetched chargebee subs")
        })
        .then(filterSubs(start, end))
        .then(organizeSubs)
    }).then(function(files){
      debug("gathering counts")
      var counts = {}
      counts["custom fabian"] = _.size(files["custom fabian"])
      counts["custom mike"] = _.size(files["custom mike"])
      _.each(files["chargebee"], function(val, key){
        counts["chargebee "+key] = _.size(val)
      })
      counts["complete total"] = 0
      counts["complete total"] += counts["chargebee valid"]

      if(start && end){

      }else{
        counts["complete total"] += counts["custom fabian"]
        counts["complete total"] += counts["custom mike"]
      }

      files.counts = _.map(counts, function(val, key){
        var temp = {}
        temp["id"] = key
        temp["count"] = val
        return temp
      })
      return files
    }).then(function(files){

      if(start && end){
        var allSubscriptions =_.map(files["chargebee"].valid, formatSub)
      }else{
        var allSubscriptions = _.flatten([
          _.map(files["chargebee"].valid, formatSub),
          files["custom mike"],
          files["custom fabian"]
        ])
      }

      return csv.stringifyAsync(allSubscriptions, {header: true}).then(function(ready){
        files.ready = ready
        return files
      })
    }).then(function(files){
      var nextMonth = moment().add(1, 'months')
      var month = nextMonth.format("YYMM")
      var monthName = nextMonth.format("MMMM")
      var dateStamp = moment().format("YYMMDD")

      if(start && end){
        var subsFileString = "Welcome Kits %s-%s (On %s)"
        var reportFileString = "Welcome Kits %s-%s (On %s) REPORT"
        var subsFileName = util.format(subsFileString, start.format("YYMMDD"), end.format("YYMMDD"), dateStamp)
        var reportFileName = util.format(reportFileString, start.format("YYMMDD"), end.format("YYMMDD"), dateStamp)
      }else{
        var subsFileString = "Subscriptions Final %s (For %s) (On %s)"
        var reportFileString = "Subscriptions Final %s (For %s) (On %s) REPORT"
        var subsFileName = util.format(subsFileString, month, monthName, dateStamp)
        var reportFileName = util.format(reportFileString, month, monthName, dateStamp)
      }

      debug("naming new drive files")

      return Promise.props({
        "subscriptions": upload(drive, subsFileName, files.ready),
        "report": csv.stringifyAsync(files.counts, {header: true}).then(function(file){
          return upload(drive, reportFileName, file)
        })
      })
    }).then(function(responses){
      debug("constructing slack message")
      var message = ""
      if(start && end){
        message += "Welcome Kits are in!"+"\n"
      }else{
        message += "Subscriptions are in!"+"\n"
      }
      _.each(responses, function(response, key){
        message += "Here's the "+ key + "\n"
        message += response.alternateLink + "\n"
        message += "\n"
      })
      return sendMessage("#subscription", message).tap(function(body){
        if(body.ok) debug("sent to slack")
      })
    })
  })

}

module.exports = mergeFiles
