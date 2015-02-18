var Promise = require("bluebird")
var request = Promise.promisify(require("request"))

function sendMessage(channel, message){
  return request({
    "method": "POST",
    "url": "https://slack.com/api/chat.postMessage",
    "json": true,
    "form": {
      token: process.env.SLACK_KEY,
      text: message,
      channel: channel,
      username: process.env.SLACK_USER,
      icon_url: process.env.SLACK_IMAGE
      //icon_url:process.env.SLACK_IMAGE
      //icon_url: process.env.SLACK_IMAGE,
      //icon_url: process.env.SLACK_IMAGE
    }
  }).spread(function(response, body) {
    return body;
  })
}

module.exports = sendMessage
