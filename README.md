# Repost Twitter Feed To Telegram

This bot was written so that using Telegram I could receive messages from the Twitter feed I was interested in and post them to the Telegram channel. Due to the lack of free access to Twitter API, I used the RSS feed from [Nitter](https://nitter.net/). The disadvantage of this approach is that I receive posts with a delay of 5-10 minutes.

Google Apps Script and Google Sheets were used as a database. The script from Google Apps Script can be viewed in the file `appsScript.gs`.

# Dependencies

```sh
npm init
```

```sh
npm install telegraf
```

```sh
npm install dotenv
```

```sh
npm install node-cron
```

```sh
npm install rss-parser
```

```sh
npm install axios
```

# To do

- [x] Add README
- [ ] Add the ability to set up a bot for any channel or user and add a monitored twitter feed
- [ ] Connect to a normal database...???

# Example

An example of the channel and feed to which the bot is reposting

From [Nitter](https://nitter.net/game8_d4boss) to [Telegram channel](https://t.me/Diablo4Alerts)
