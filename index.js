var oauth2Client = require("./oauth2Client")
var mergeFiles = require("./mergeFiles")
var accessToken = oauth2Client.credentials.access_token

mergeFiles(accessToken).then(function(files){
  console.log(files)
})
