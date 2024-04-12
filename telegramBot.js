const TelegramBot = require('node-telegram-bot-api');

const botToken = "6982147281:AAF8tTMmMuLuTohDSIg1U9RpvzLZ0Eidv20";
const bot = new TelegramBot(botToken, { polling: true });
const chatId = "Y7185443526";

function sendNotification(message) {
  bot.sendMessage(chatId, message);
}

module.exports = { sendNotification };