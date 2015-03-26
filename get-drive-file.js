var Promise = require("bluebird")
var request = require("request")

request = Promise.promisify(request)

function getDriveFile(drive, id){
  return drive.files.getAsync({ fileId: id })
    .spread(function(data, response){
      return data.exportLinks['text/csv']
    }).then(function(csvDownload){
      return request({
        "method":"GET",
        "url": csvDownload,
        "headers":{
          "Authorization": "Bearer " + drive._options.auth.credentials.access_token
        }
      }).spread(function(response, body){
        return body
      })
    })
}

module.exports = getDriveFile
