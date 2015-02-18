var debug = require("debug")("main")
var mergeFiles = require("./mergeFiles")
var sendMessage = require("./sendMessage")

var CronJob = require('cron').CronJob;

debug("cronscripts running")

var job = new CronJob({
  cronTime: '0 12 * * *',
  onTick: function() {
    debug("it's noon")
  },
  start: true,
  timeZone: "America/New_York"
});

var job = new CronJob({
  cronTime: '0 12 14 * *',
  onTick: function() {
    // runs every 14th
    var sendMessage = require("./sendMessage")
    var message = [
      "@pforti @michaelrad @tylea @reggi",
      "subscriptions",
      "are going to be generated noon tomorrow."
    ].join(" ")
    sendMessage("#subscription", message)
  },
  start: true,
  timeZone: "America/New_York"
});

var job = new CronJob({
  cronTime: '0 12 15 * *',
  onTick: function() {
    // runs every 15th
    mergeFiles("subscription")
  },
  start: true,
  timeZone: "America/New_York"
});

var job = new CronJob({
  cronTime: '0 12 * * 2',
  onTick: function() {
    // runs every 14th
    var sendMessage = require("./sendMessage")
    var message = [
      "@tylea @reggi",
      "welcome kits",
      "are going to be generated noon tomorrow."
    ].join(" ")
    sendMessage("#subscription", message)
  },
  start: true,
  timeZone: "America/New_York"
});

var job = new CronJob({
  cronTime: '0 12 * * 3',
  onTick: function() {
    // runs every wendsday
    mergeFiles("welcome-kits")
  },
  start: true,
  timeZone: "America/New_York"
});
