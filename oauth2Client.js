var Promise = require("bluebird")
var fs = Promise.promisifyAll(require("fs"))
var moment = require("moment")
var tokens = require("./tokens.json")
var google = require('googleapis')
var OAuth2 = google.auth.OAuth2
var clientSecrets = require("./client_secrets.json")
var oauth2Client = new OAuth2(clientSecrets.web.client_id, clientSecrets.web.client_secret, clientSecrets.web.redirect_uris[0]);

oauth2Client.setCredentials({
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token
});

var tokenExpireDate = moment(tokens.expiry_date, "x")
var tokenIsExpired = moment().isAfter(tokenExpireDate)
if(tokenIsExpired){
  oauth2Client.refreshAccessToken(function(err, tokens) {
    fs.writeFileAsync("../tokens.json", JSON.stringify(tokens), "utf8");
  });
}

module.exports = oauth2Client

/*

var tokens = require("../tokens.json")
var clientSecrets = require("../client_secrets.json")
var moment = require("moment")
var Promise = require("bluebird")
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var fs = Promise.promisify(require("fs"))

function getAccessToken(){
  var tokenExpireDate = moment(tokens.expiry_date, "x")
  var tokenIsExpired = moment().isAfter(tokenExpireDate)
  if(!tokenIsExpired) return Promise.resolve(tokens.access_token)
  var tokenProvider = new GoogleTokenProvider({
    refresh_token: tokens.refresh_token,
    client_id: clientSecrets.web.client_id,
    client_secret: clientSecrets.web.client_secret
  });
  return new Promise(function(resolve, reject){
    tokenProvider.getToken(function(err, token){
      if(err) return reject(err);
      return resolve(token)
    })
  })
}



getAccessToken().then(function(newToken){
  if(token.access_token !== newToken){
    token.access_token = newToken
    fs.writeFileAsync("./tokens.json", JSON.stringify(tokens), "utf8");
  }
})












*/
