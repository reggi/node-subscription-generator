var Promise = require("bluebird")
var request = Promise.promisify(require("request"))

var slackkey = process.env.SLACK_KEY
var slackuser = process.env.SLACK_USER
var slackimg = process.env.SLACK_IMAGE

function sendMessage(channel, message){
  return request({
    "method": "POST",
    "url": "https://slack.com/api/chat.postMessage",
    "json": true,
    "form": {
      token: slackkey,
      text: message,
      channel: channel,
      username: slackuser,
      icon_url: slackimg
    }
  }).spread(function(response, body) {
    return body;
  })
}

module.exports = sendMessage
