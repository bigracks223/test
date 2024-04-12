const botToken = "6982147281:AAF8tTMmMuLuTohDSIg1U9RpvzLZ0Eidv20";
const bot = new TelegramBot(botToken, { polling: true });
const chatId = "Y7185443526";

function sendNotification(message) {
  const options = {
    chat_id: chatId,
    text: message,
  };

  bot.sendMessage(options, function (error, response) {
    if (error) {
      console.error(error);
    } else {
      console.log("Message sent: " + response.message_id);
    }
  });
}

module.exports = { sendNotification };
