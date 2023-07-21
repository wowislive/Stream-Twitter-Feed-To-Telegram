const { Telegraf } = require("telegraf"); // telegram bot library
const cron = require("node-cron"); // library for implementing the function execution schedule
const axios = require("axios"); // HTTP client for JavaScript
const Parser = require("rss-parser"); //  library for turning RSS XML feeds into JavaScript objects
require("dotenv").config();

const parser = new Parser();
const bot = new Telegraf(process.env.BOT_TOKEN);

// ids for private chats and channels in which bot activity is allowed
const allowedChats = [
  "-926114543",
  "-1001900174358",
  "-1001945716699",
  "470471049",
];
const postChannelId = "-1001945716699"; // ID of the channel in which publications will be made

// function for middleware that will restrict the use of the bot in unspecified chats
const restrictedToChat = (ctx, next) => {
  try {
    if (allowedChats.includes(ctx.chat.id.toString())) {
      return next();
    }
    return ctx.reply("Извините, этот бот не доступен в вашем чате");
  } catch (error) {
    console.log(error);
  }
};

bot.use(restrictedToChat);

// RSS URL that you want to read
const feedUrl = "https://ntr.nah.re/game8_d4boss/with_replies/rss";
// objects with additional parameters for publishing posts in a channel
const alertMessageOptions = {
  parse_mode: "HTML",
  disable_notification: false,
  disable_web_page_preview: true,
};
const noAlertMessageOptions = {
  parse_mode: "HTML",
  disable_notification: true,
  disable_web_page_preview: true,
};

// function for reading RSS feed and processing the received data
async function readRssFeed() {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed;
  } catch (err) {
    console.log("Error reading RSS feed:", err);
  }
}

// retrieves all "src" attribute values from <img> tags
const grabImgs = (item) => {
  try {
    let match;
    let matches = [];

    let transformMatch; // Variables for URL transformation
    let extension; // Variables for URL transformation

    const imgSrcRegex = /<img src="(.*?)"/g;
    while ((match = imgSrcRegex.exec(item.content))) {
      transformMatch = match[1];
      // The instance of Nitter I'm currently using doesn't allow me to embed images from its own address, so I'm transforming these image URLs into Twitter image URLs.
      transformMatch = transformMatch.replace(
        "http://ntr.nah.re/pic/media%2F",
        "http://pbs.twimg.com/media/"
      );
      extension = transformMatch.substr(transformMatch.lastIndexOf(".") + 1);
      transformMatch = transformMatch.replace(
        "." + extension,
        "?format=" + extension
      );
      // end of transforming
      matches.push(transformMatch);
    }
    return matches;
  } catch (error) {
    console.log(error);
  }
};

// create an array with media content for a media post
const setMediaArr = (imgs, text) => {
  try {
    let mediaArr = [];
    imgs.forEach((item) => {
      mediaArr.push({
        type: "photo",
        media: item,
      });
    });
    mediaArr[0].caption = text;
    return mediaArr;
  } catch (error) {
    console.log(error);
  }
};

// sending post request to apps script and getting response
const postToAppsScript = async (inputString) => {
  try {
    const scriptUrl = process.env.APPS_SCRIPT;
    const response = await axios.post(scriptUrl, { inputString });
    const result = response.data;
    return result;
  } catch (error) {
    console.error("Ошибка выполнения скрипта:", error);
  }
};

// main function
const doPost = async () => {
  try {
    const channelId = postChannelId;
    const latestTwits = await readRssFeed();
    const latestTwit = latestTwits.items[0]; // we work only with the latest tweet
    const messageText = latestTwit.title + "\n\n" + latestTwit.link; // compose the text part of the post
    const response = await postToAppsScript(latestTwit.link.toString());
    // getting a response "Complete string match" means that we already posted this message
    if (response == "Complete string match") {
      return;
      // if the response contains the same url as the url of the last tweet, publish the post
    } else if (response == latestTwit.link.toString()) {
      if (latestTwit.title.includes("R to @")) {
        // if the tweet contains "R to @", this is a reply and we don't want to repost it
        console.log("This is a reply 0_o");
        return;
      } else if (latestTwit.content.includes("<img")) {
        // if the tweet contains images, we send a media post, if not, then a text post
        let imgs = await grabImgs(latestTwit);
        let inputMedia = await setMediaArr(imgs, messageText);
        try {
          await bot.telegram.sendMediaGroup(
            channelId,
            inputMedia,
            alertMessageOptions
          );
        } catch (error) {
          console.log(error);
          console.log(inputMedia);
          // When receiving a possible error 400 (or any other) while creating a media group we post a text message
          await bot.telegram.sendMessage(
            channelId,
            messageText,
            alertMessageOptions
          );
        }
      } else {
        await bot.telegram.sendMessage(
          channelId,
          messageText,
          noAlertMessageOptions
        );
      }
    } else {
      console.log(response);
    }
  } catch (error) {
    console.log(error);
  }
};

// set the function execution schedule once per minute
cron.schedule("* * * * *", () => {
  try {
    doPost();
  } catch (error) {
    console.log(error);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
