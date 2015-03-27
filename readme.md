# Cron + Chargebee + Google drive + Slack

* `index.js` uses `[node-cron](https://github.com/ncb000gt/node-cron)` to run `merge-files.js` at interval times
* There are five crontabs running
  * `"onNoon": "0 12 * * *"` (the test runs everyday)
  * `"onFourteen": "0 12 14 * *"` (the alert for the subscription)
  * `"onFifteen": "0 12 15 * *"` (the subscription runs)
  * `"onTuesday": "0 12 * * 2"` (the alert for the welcome kits)
  * `"onWednesday": "0 12 * * 3"` (the welcome kit runs)
* Info about `mergeFiles()` function also known as `theRundown()`
  * Params
    * `welcome-kit` will automatically generate a welcome kit
    * Any other param value other than `welcome-kit` will be `subscription`
  * Operations
    * Gets google drive keys
    * Fetches 3 google drive spreadsheets
    * If it's a welcome-kit it gets the span of dates since the last welcome-kit (uses google drive spreadsheet as data-store)
    * Gets the chargebee subscriptions
    * Adds flags to subscriptions if subscription matches certain conditions
    * Flaged subscriptions are indexed
    * Use the `valid` indexed subs to create contents for the `main` spreadsheet export
    * Get the counts of all the different indexed subs
    * Use the counts to form the `report` spreadsheet export
    * Create another `help` spreadsheet export with links to chargebee subs
    * Loop over all exports (`main`,`report`,`help`) and push them to google drive
    * Slack message goes out with all of the urls to the new exported docs
    
## Environment Variables

This project is hosted on Heroku. So I have a remote for Heroku set up locally. I have a `.env` file that sets all the environment variables and I can used `heroku config:push` to upload all of the `.env` variables to the server. I can always use `heroku config:pull` to get them back if starting from this bare repo.

Within `package.json` I have a script that will put the variables from `.env` into the current session. It uses this `export $(cat ./.env | grep -v ^# | xargs)`.

## To deploy from scratch

1. Create a `.env` file with the following variables

```
CHARGEBEE_API_KEY="{{ your value }}"
CHARGEBEE_SITE="{{ your value }}"
GOOGLE_DRIVE_FABIAN_DOC="{{ your value }}"
GOOGLE_DRIVE_MIKE_DOC="{{ your value }}"
GOOGLE_DRIVE_UPLOAD_PARENT_ID="{{ your value }}"
GOOGLE_DRIVE_WEB_CLIENT_ID="{{ your value }}"
GOOGLE_DRIVE_WEB_CLIENT_SECRET="{{ your value }}"
GOOGLE_DRIVE_WEB_REDIRECT_URI="{{ your value }}"
GOOGLE_DRIVE_WELCOMEKIT_DOC="{{ your value }}"
SLACK_IMAGE="{{ your value }}"
SLACK_KEY="{{ your value }}"
SLACK_USER="{{ your value }}"
GD_USER_ACCESS_TOKEN="{{ your value }}"
GD_USER_TOKEN_TYPE="{{ your value }}"
GD_USER_EXPIRY_DATE="{{ your value }}"
GD_USER_REFRESH_TOKEN="{{ your value }}"
```

2. Create a Heroku project

```
heroku create
```

3. Push the .env variables

```
heroku config:push
```

4. Deploy

```
git push heroku master
```

## To deploy with no local but running heroku

1. Clone the repo

```
git@github.com:reggi/node-subscription-generator.git
cd node-subscription-generator
```

2. Add Heroku remote

```
heroku git:remote -a {{ your project name }}
```

2. Pull `.env` vars

```
heroku config:pull
```

3. Push changes

```
git push heroku master
```