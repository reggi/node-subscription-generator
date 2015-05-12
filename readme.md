# Subscription Generator

> Cron + Chargebee + Google Drive + Slack

This is a pice of software I made to automate some of the more manual tasks that take place behind the scenes at the Holstee office.

At Holstee we have a product we offer called the [Mindful Art Subscription](https://www.holstee.com/pages/subscription) it's a service where we mail you a greeting card on a monthly basis.

On the technical side we use a piece of software called [ChargeBee](https://www.chargebee.com/) which manages the subscriptions and payment processing.

At Holstee we found the need to have wholesale spreadsheets containing subscriptions that lived outside of ChargeBee.

This software does a couple of things

* Pulls in subscriptions from specified google drive spreadsheets
* Pulls in subscriptions from ChargeBee
* Organizes an export spreadsheet to send to the fulfillment center ([with specific / necessary columns](https://github.com/reggi/node-subscription-generator/blob/master/format-subs.js#L32-L42))
* Compiles a list of numbers and [counts](https://github.com/reggi/node-subscription-generator/blob/master/merge-files.js#L169-L185) for [specific cases](https://github.com/reggi/node-subscription-generator/blob/master/filter-subs.js#L40-L105) that we can send off to our accountants.
* Runs and gathers these things at set intervals (once a week / once a month).
* Sends a slack message with created google drive urls.

## Technical Process

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
CHARGEBEE_API_KEY={{ your value }}
CHARGEBEE_SITE={{ your value }}
GOOGLE_DRIVE_FABIAN_DOC={{ your value }}
GOOGLE_DRIVE_MIKE_DOC={{ your value }}
GOOGLE_DRIVE_UPLOAD_PARENT_ID={{ your value }}
GOOGLE_DRIVE_WELCOMEKIT_DOC={{ your value }}
GOOGLE_DRIVE_WEB_CLIENT_ID={{ your value }}
GOOGLE_DRIVE_WEB_CLIENT_SECRET={{ your value }}
GOOGLE_DRIVE_WEB_REDIRECT_URI={{ your value }}
SLACK_IMAGE={{ your value }}
SLACK_KEY={{ your value }}
SLACK_USER={{ your value }}
```

3. Getting Google User Credentials

The project includes a `server.js` file that sets up a simple server it uses the `GOOGLE_DRIVE_WEB_` credentials to set up a connection to google drive and redirect callback url.

Run the server with the following command:

```
npm run drive
```

Alternatively start the server and open the following page:

```
foreman run node ./server.js
```

Then visit http://localhost:3000/google in your browser.

This will make a file `.tokens`.

```
GD_USER_ACCESS_TOKEN={{ your value }}
GD_USER_TOKEN_TYPE={{ your value }}
GD_USER_EXPIRY_DATE={{ your value }}
GD_USER_REFRESH_TOKEN={{ your value }}
```

You can append this to the `.env` file with the following command:

```
cat .tokens >> .env
```

4. Create a Heroku project

```
heroku create
```

5. Push the .env variables

```
heroku config:push
```

6. Deploy

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

## Extra thoughts

* Thoughts about programmatically emailing fulfillment center directly, closing the entire loop
* In the beginning I was manually downloading an export of subscriptions from ChargeBee, piecing all the docs together and it was a mess. I'd forget to do it some days, creating delays where the customers would receive shipments later then expected, which is totally unacceptable.
* The simple process of taking a spreadsheet and filtering the columns you want is a super tedious process itself.
