var debug = require("debug")("main")
var mergeFiles = require("./merge-files")
var sendMessage = require("./send-message")

var crontabs = {
  "onNoon": "0 12 * * *",
  "onFourteen": "0 12 14 * *",
  "onFifteen": "0 12 15 * *",
  "onTuesday": "0 12 * * 2",
  "onWednesday": "0 12 * * 3",
}

var CronJob = require('cron').CronJob;

debug("cronscripts running")

var job = new CronJob({
  cronTime: crontabs["onNoon"],
  onTick: function() {
    debug("it's noon")
  },
  start: true,
  timeZone: "America/New_York"
});

var job = new CronJob({
  cronTime: crontabs["onFourteen"],
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
  cronTime: crontabs["onFifteen"],
  onTick: function() {
    // runs every 15th
    mergeFiles("subscription")
  },
  start: true,
  timeZone: "America/New_York"
});

var job = new CronJob({
  cronTime: crontabs["onTuesday"],
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
  cronTime: crontabs["onWednesday"],
  onTick: function() {
    // runs every wendsday
    mergeFiles("welcome-kit")
  },
  start: true,
  timeZone: "America/New_York"
});
