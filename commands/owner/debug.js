const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "debug",
  aliases: ["exec"],
  exec: async (client, args, message) => {
    const debugUsers = ["948937171031695411", "948937171031695411"];

    if (!debugUsers.includes(message.author.id)) {
      return message.reply({
        content: `${client.emoji.cross} Only <@948937171031695411> can run this command!`,
      });
    }

    if (!args[0]) {
      const debugStartTime = performance.now();
      const query = args.join(" ");
      const command = client.commands.get(query);
      if (!command) {
        return message.reply("Invalid command name.");
      }
      client.commands.get(query).run(client, message, args);
      const debugEndTime = performance.now();
      const executionTime = (debugEndTime - debugStartTime).toFixed(3);
      message.channel.send(`Command ${query} debugged in ${executionTime} seconds.`);
    }
  },
};
