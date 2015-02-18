var Promise = require("bluebird")
var express = require('express')
var app = express()

var google = require('googleapis')
var OAuth2 = google.auth.OAuth2
var clientSecrets = require("./client_secrets.json")
var oauth2Client = new OAuth2(clientSecrets.web.client_id, clientSecrets.web.client_secret, clientSecrets.web.redirect_uris[0]);
oauth2Client.getToken = Promise.promisify(oauth2Client.getToken)

var fs = Promise.promisifyAll(require("fs"))

app.get('/google', function (req, res) {
  var url = oauth2Client.generateAuthUrl({
    approval_prompt: "force",
    access_type: 'offline',
    scope: "https://www.googleapis.com/auth/drive"
  })
  return res.redirect(url)
})

app.get('/oauth2callback', function (req, res) {
  return oauth2Client.getToken(req.query.code).then(function(tokens){
    fs.writeFileAsync("./tokens.json", JSON.stringify(tokens, undefined, 2), "utf8");
    return res.json(tokens)
  }).catch(function(err){
    return res.redirect("/google")
  })
})

var server = app.listen(3000, function () {})
