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
    
