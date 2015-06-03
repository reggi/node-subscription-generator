var debug = require("debug")("merge-files")
var sendMessage = require("./send-message")
var util = require("util")
var getDriveFile = require("./get-drive-file")
var getSubs = require("./get-subs")
var formatSub = require("./format-subs")
var filterSubs = require("./filter-subs")
var _ = require("underscore")
var Promise = require("bluebird")
var moment = require("moment")
var fs = Promise.promisifyAll(require("fs"))
var csv = Promise.promisifyAll(require("csv"))
var getAuthClient = require("./auth-client")
var google = require('googleapis')
var email = require("emailjs")

var server = email.server.connect({
   user: process.env.EMAIL_USER,
   password: process.env.EMAIL_PASSWORD,
   host: process.env.EMAIL_HOST,
   ssl: true
})

server.sendAsync = Promise.promisify(server.send)

var uloadparent = process.env.GOOGLE_DRIVE_UPLOAD_PARENT_ID
var fabiandoc = process.env.GOOGLE_DRIVE_FABIAN_DOC
var mikedoc = process.env.GOOGLE_DRIVE_MIKE_DOC
var kitdoc = process.env.GOOGLE_DRIVE_WELCOMEKIT_DOC
var chargebeesite = process.env.CHARGEBEE_SITE

function driveGetAndParse(drive, fileId, fileName){
  return getDriveFile(drive, fileId).then(function(file){
    if(file.match("<!DOCTYPE html>")) throw new Error(fileName + " is not found")
    debug("fetched google drive %s doc", fileName)
    return csv.parseAsync(file, {columns: true})
  })
}

function chargebeeGet(start, end){
  return getSubs().tap(function(){
    debug("fetched chargebee subs")
  })
  .then(filterSubs(start, end))
  .then(organizeSubs)
}

function insert(drive, item){
  debug("inserting google drive file")
  return drive.files.insertAsync({
    newRevision: false,
    convert: true,
    resource: {
      title: item.name,
      mimeType: 'text/csv',
      parents: [{"id":uloadparent}],
    },
    media: {
      mimeType: 'text/csv',
      body: item.content,
    }
  }).spread(function(data, response){
    return data
  })
}

function update(drive, item){
  debug("updating google drive file")
  return drive.files.updateAsync({
    fileId: item.id,
    newRevision: false,
    convert: true,
    resource: {
      title: item.name,
      mimeType: 'text/csv',
      parents: [{"id":uloadparent}],
    },
    media: {
      mimeType: 'text/csv',
      body: item.content,
    }
  }).spread(function(data, response){
    return data
  })
}

function upload(drive, item){
  if(item.name) debug("uploading %s", item.name)
  if(item.id) return update(drive, item)
  return insert(drive, item)
}

function parseAndUpload(drive, item){
  return csv.stringifyAsync(item.content, {header: true})
    .then(function(content){
      item.content = content
      return upload(drive, item)
    })
}

function mapPromise(obj, promiseFunc, drive){
  var objectWithPromises = _.object(_.map(obj, function (item, key) {
      return [key, promiseFunc(drive, item)];
  }));
  return Promise.props(objectWithPromises)
}

function theRundown(flag){
  if(!flag) flag = "subscription"
  debug("readying to generate: %s", flag)
  var drive = false
  return getAuthClient().then(function(authClient){
    // use token to get drive files
    drive = google.drive({ version: 'v2', auth: authClient })
    drive.files = Promise.promisifyAll(drive.files)
    debug("retrieved google access token")
    return Promise.props({
      "googleKit": driveGetAndParse(drive, kitdoc, "Welcome Kit DB"),
      //"googleMike": driveGetAndParse(drive, mikedoc, "Mike's"),
      //"googleFabian": driveGetAndParse(drive, fabiandoc, "Fabian's")
    })
  })
  .then(function(docs){
    // get the dates-span if welcome kits from kit doc in drive
    debug("generating datespans")
    var data = {}
    data.docs = docs
    data.dates = {}

    data.dates.startMoment = false
    data.dates.startYYMMDD = false
    data.dates.startMMDDYY = false

    data.dates.endMoment = false
    data.dates.endYYMMDD = false
    data.dates.endMMDDYY = false

    data.dates.todayMoment = moment()
    data.dates.todayYYMMDD = data.dates.todayMoment.format("YYMMDD")
    data.dates.todayMMDDYY = data.dates.todayMoment.format("MM-DD-YY")
    data.dates.todayMMDDYYTime = data.dates.todayMoment.format("MM-DD-YY h:mm:ss a")

    data.dates.nextMonth = moment().add(1, 'months')
    data.dates.nextMonthYYMM = data.dates.nextMonth.format("YYMM")
    data.dates.nextMonthWordYear = data.dates.nextMonth.format("MMMM YYYY")

    if(flag == "welcome-kit"){

      var latest = _.last(docs.googleKit)

      data.dates.startMoment = moment(latest.end, "YYMMDD").add(1, "day")
      data.dates.startYYMMDD = data.dates.startMoment.format("YYMMDD")
      data.dates.startMMDDYY = data.dates.startMoment.format("MM-DD-YY")

      data.dates.endMoment = data.dates.todayMoment.subtract(1, "day")
      data.dates.endYYMMDD = data.dates.endMoment.format("YYMMDD")
      data.dates.endMMDDYY = data.dates.endMoment.format("MM-DD-YY")

      if(data.dates.startYYMMDD == data.dates.endYYMMDD) throw new Error("datespan is same day")
      if(data.dates.startMoment.isAfter(data.dates.endMoment)) throw new Error("start is after end")

      debug("start date is %s and the end is %s", data.dates.startYYMMDD, data.dates.endYYMMDD)
    }
    return data
  }).then(function(data){
    // get chargebee subs
    return getSubs().tap(function(subs){
      debug("fetched chargebee subs")
    })
    .then(filterSubs(data.dates.startYYMMDD, data.dates.endYYMMDD))
    .then(function(subs){
      data.chargebee = subs
      return data
    })
  }).then(function(data){
    // exporting data
    data.exports = {}
    data.exports.main = {}
    var content = _.map(data.chargebee.valid, formatSub)
    content = _.map(content, function(row){
      if(flag == "welcome-kit") row["sku"] = "GCINTR-001"
      delete row["subscription.id"]
      return row
    })

    data.exports.main.content = content

    var subsName = util.format("Subscriptions for %s (Exported %s)", data.dates.nextMonthWordYear, data.dates.todayMMDDYYTime)
    var kitName = util.format("Welcome Kits for %s to %s (Exported %s)", data.dates.startMMDDYY, data.dates.endMMDDYY, data.dates.todayMMDDYYTime)
    
    data.exports.main.name = (flag !== "welcome-kit") ? subsName : kitName

    return data
  }).then(function(data){
    // get counts
    var counts = {}
    //counts["custom fabian"] = _.size(data.docs.googleFabian)
    //counts["custom mike"] = _.size(data.docs.googleMike)
    _.each(data.chargebee, function(val, key){
      counts["chargebee "+key] = _.size(val)
    })
    counts["complete export"] =  _.size(data.exports.main.content)
    //counts["total wholesale"] = _.size(data.docs.googleFabian) + _.size(data.docs.googleMike)
    data.counts = _.map(counts, function(val, key){
      var temp = {}
      temp["id"] = key
      temp["count"] = val
      return temp
    })
    return data
  }).then(function(data){
    data.exports.report = {}
    data.exports.report.content = data.counts
    data.exports.report.name = data.exports.main.name + " REPORT"
    return data
  }).then(function(data){
    //export kit update for kits only
    if(flag !== "welcome-kit") return data
    data.docs.googleKit.push({
      "start": data.dates.startYYMMDD,
      "end": data.dates.endYYMMDD
    })
    data.exports.updateKit = {}
    data.exports.updateKit.content = data.docs.googleKit
    data.exports.updateKit.name = "Welcome Kit Dates Storage database"
    data.exports.updateKit.id = kitdoc
    return data
  }).then(function(data){
    //export customer-service help doc
    data.exports.help = {}
    data.exports.help.content = _.map(data.chargebee.valid, formatSub)
    var content = _.map(data.chargebee.valid, formatSub)
    content = _.map(content, function(row){
      row["chargebee.url"] = "https://"+chargebeesite+".chargebee.com/admin-console/subscriptions/"+row["subscription.id"]
      delete row["subscription.id"]
      return row
    })
    data.exports.help.content = content
    data.exports.help.name = data.exports.main.name + " HELP"
    return data
  }).then(function(data){
    // loops over all exports and uploads them to GD
    return mapPromise(data.exports, parseAndUpload, drive)
      .then(function(responses){
        data.responses = responses
        return data
      })
  }).then(function(data){

    var theHeadline = (flag == "welcome-kit") ? "Welcome Kits are in!" : "Subscriptions are in!"

    var msgWelcomeKits = "Attached are the new Welcome Kits for new Art Subscribers this past week."
    var msgSubscription = "Attached are the Subscriptions for this month."
    var theMessage =  (flag == "welcome-kit") ? msgWelcomeKits : msgSubscription

    var emailWelcomeKits = "Welcome Kit <welcomekits@holstee.com>"
    var emailSubscription = "Monthly Subscribtions <monthlysubscribtions@holstee.com>"
    var theEmail = (flag == "welcome-kit") ? emailWelcomeKits : emailSubscription

    // slack message
    var slackMessage = []
    slackMessage.push("Hey @daverad")
    slackMessage.push(theHeadline)
    _.each(data.responses, function(response, name){
      slackMessage.push("Generated file '"+ name +"'")
      slackMessage.push(response.alternateLink)
    })
    slackMessage = slackMessage.join("\n")

    // email message
    var emailMessage = []
    //emailMessage.push(theHeadline)
    emailMessage.push(theMessage+"\n")
    //emailMessage.push("Generated file '"+ data.exports.main.name +"':")
    //emailMessage.push(data.responses.main.alternateLink)
    emailMessage = emailMessage.join("\n")

    return Promise.all([
      server.sendAsync({
        text: emailMessage,
        from: "Thombot <bot@holstee.com>",
        to: theEmail,
        subject: data.exports.main.name,
        attachment: [
          {
            type: "text/csv",
            name: data.exports.main.name + ".csv",
            data: data.exports.main.content,
          },
        ]
      }).tap(function(){
        return debug("email sent")
      }),
      sendMessage("#subscription", slackMessage).tap(function(){
        return debug("slack message sent")
      })
    ])

  })
}

module.exports = theRundown
