const { Telegraf } = require("telegraf");
const cron = require("node-cron");
const axios = require("axios");
const Parser = require("rss-parser");
require("dotenv").config();

const parser = new Parser();
const bot = new Telegraf(process.env.BOT_TOKEN);

const allowedChats = [
  "-926114543",
  "-1001900174358",
  "-1001945716699",
  "470471049",
];
const postChannelId = "-1001945716699";

const restrictedToChat = (ctx, next) => {
  if (allowedChats.includes(ctx.chat.id.toString())) {
    return next();
  }
  return ctx.reply("Извините, этот бот не доступен в вашем чате");
};

bot.use(restrictedToChat);

// URL RSS-ленты, которую вы хотите прочитать
const feedUrl = "https://nitter.net/game8_d4boss/rss";
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

// Функция для чтения RSS-ленты и обработки полученных данных
async function readRssFeed() {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed;
  } catch (err) {
    console.log("Ошибка при чтении RSS-ленты:", err);
  }
}

const grabImgs = (item) => {
  let match;
  let matches = [];
  const imgSrcRegex = /<img src="(.*?)"/g;
  while ((match = imgSrcRegex.exec(item.content))) {
    matches.push(match[1]);
  }
  return matches;
};

const setMediaArr = (imgs, text) => {
  let mediaArr = [];
  imgs.forEach((item) => {
    mediaArr.push({
      type: "photo",
      media: item,
    });
  });
  mediaArr[0].caption = text;
  return mediaArr;
};

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

const doPost = async () => {
  try {
    // ID канала, в который нужно опубликовать сообщение
    const channelId = postChannelId;
    // Текст сообщения для публикации
    const latestTwits = await readRssFeed();
    const latestTwit = latestTwits.items[0];
    const messageText = latestTwit.title + "\n\n" + latestTwit.link;
    const response = await postToAppsScript(latestTwit.link.toString());
    if (response == "Complete string match") {
      return;
    } else if (response == latestTwit.link.toString()) {
      if (latestTwit.content.includes("<img")) {
        let imgs = grabImgs(latestTwit);
        let inputMedia = setMediaArr(imgs, messageText);
        bot.telegram.sendMediaGroup(channelId, inputMedia, alertMessageOptions);
      } else {
        bot.telegram.sendMessage(channelId, messageText, noAlertMessageOptions);
      }
    } else {
      console.log(response);
    }
  } catch (error) {
    console.log(error);
  }
};

cron.schedule("* * * * *", () => {
  doPost();
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
