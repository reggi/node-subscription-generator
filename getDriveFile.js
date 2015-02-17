var Promise = require("bluebird")
var request = require("request")

request = Promise.promisify(request)

function getDriveFile(token, fileId){
  return request({
    "method":"GET",
    "url": "https://docs.google.com/feeds/download/spreadsheets/Export",
    "qs":{
        "exportFormat": "csv",
        "key": fileId,
        "gid": 0
    },
    "headers":{
        "Authorization": "Bearer " + token
    }
  }).spread(function(response, body){
    return body
  })
}

module.exports = getDriveFile
