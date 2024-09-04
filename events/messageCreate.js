// Import necessary modules and initialize
const client = require("../index.js");
const st = require("../settings.js").bot;
const { ownerIDS } = require("../owner.json");
const { MessageActionRow, MessageButton, EmbedBuilder } = require("discord.js");
const top = require("@top-gg/sdk");
const vote = new top.Api("YOUR_TOP_GG_API_KEY");

const button = new MessageActionRow().addComponents(
  new MessageButton()
    .setLabel("Vote Me")
    .setStyle("LINK")
    .setURL(`https://top.gg/bot/${client.user.id}?s=0ae05abf3185d`)
);

// Helper functions
function isServerOwnerOrBotOwner(message) {
  return (
    message.author.id === message.guild?.ownerId ||
    ownerIDS.includes(message.author.id)
  );
}

function getReadablePermissions(permissions) {
  return permissions.map((perm) => `\`${perm}\``).join(", ");
}

function isUserAboveBotRole(message) {
  const botRolePosition = message.guild.members.me.roles.highest.position;
  const userRolePosition = message.member.roles.highest.position;
  return userRolePosition > botRolePosition;
}

async function isUserInBlacklist(client, ID) {
  const data = await client.db4.get(`members_bl`);
  if (!data || !data.blacklist) return false;
  return data.blacklist.includes(ID);
}

// Command handling logic
async function handleCommand(client, message, args) {
  const cmd = args.shift().toLowerCase();
  if (cmd.length === 0) return;

  let command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
  if (!command) return;

  const extraOwner = (await client.db11.get(`${message.guild.id}_eo.extraownerlist`)) || [];
  const extraAdmin = (await client.db11.get(`${message.guild.id}_ea.extraadminlist`)) || [];
  const premium = await client.db12.get(`${message.guild.id}_premium.active`);

  const userHasAdminPerm = message.member.permissions.has("ADMINISTRATOR");
  const botHasAdminPerm = message.guild.members.me.permissions.has("ADMINISTRATOR");

  const channelId = message.channel.id;
  const ignoreChannels = (await client.db10.get(`${message.guild.id}_ic.ignorechannellist`)) || [];
  const ignoreBypass = (await client.db10.get(`${message.guild.id}_ic.ignorebypasslist`)) || [];
  const mediaChannels = (await client.db14.get(`${message.guild.id}_mediachannels.mediachannellist`)) || [];

  if (message.author.bot) return;

  if (
    command.voteOnly &&
    !premium &&
    !(await vote.hasVoted(message.author.id)) &&
    !ownerIDS.includes(message.author.id)
  ) {
    return message.channel.send({
      content: `You need to vote for me in order to use this command.`,
      components: [button],
    });
  }

  if (command.botOwner && !isServerOwnerOrBotOwner(message)) {
    return message.channel.send("This command can only be used by the bot owner.");
  }

  if (
    command.serverOwnerOnly &&
    !isServerOwnerOrBotOwner(message) &&
    !extraOwner.includes(message.author.id)
  ) {
    return message.channel.send(
      "This command can only be used by the server owner or extra owners."
    );
  }

  if (
    !isServerOwnerOrBotOwner(message) &&
    userHasAdminPerm &&
    botHasAdminPerm &&
    !command.aboveRole &&
    !extraOwner.includes(message.author.id) &&
    !extraAdmin.includes(message.author.id)
  ) {
    if (mediaChannels.includes(channelId)) return;
    if (ignoreChannels.includes(channelId) && !ignoreBypass.includes(message.author.id)) {
      const ignoreMessage = await message.channel.send(
        "This channel is in my ignore list. You cannot use commands here."
      );
      setTimeout(() => ignoreMessage.delete().catch(console.error), 5000);
      return;
    }

    // Running the command and logging it
    command.run(client, message, args);
    try {
      const command_logs = await client.channels.fetch("1176492963203924088");
      if (command_logs) {
        command_logs.send({
          embeds: [
            new EmbedBuilder()
              .setFooter({
                text: message.guild.name,
                iconURL:
                  message.guild.iconURL({ dynamic: true }) ||
                  message.member.displayAvatarURL({ dynamic: true }),
              })
              .setThumbnail(message.member.displayAvatarURL({ dynamic: true }))
              .setDescription(
                `Command name: ${command.name}\nCommand Author: ${message.author.tag}\nAuthor ID: ${message.member.id}`
              ),
          ],
        });
      }
    } catch (error) {
      console.error("Error sending to log channel:", error);
    }
    return;
  }

  const missingUserPerms = command.UserPerms || [];
  const missingBotPerms = command.BotPerms || [];

  if (missingUserPerms.length > 0 && !message.member.permissions.has(missingUserPerms)) {
    return message.channel.send(
      `You need ${getReadablePermissions(missingUserPerms)} permission(s) to use this command.`
    );
  }

  if (missingBotPerms.length > 0 && !message.guild.members.me.permissions.has(missingBotPerms)) {
    return message.channel.send(
      `I need ${getReadablePermissions(missingBotPerms)} permission(s) to execute this command.`
    );
  }

  if (command.aboveRole && !isUserAboveBotRole(message)) {
    return message.channel.send(
      "You need a role higher than the bot's role to use this command."
    );
  }

  if (mediaChannels.includes(channelId)) return;
  if (ignoreChannels.includes(channelId) && !ignoreBypass.includes(message.author.id)) {
    const ignoreMessage = await message.channel.send(
      "This channel is in my ignore list. You cannot use commands here."
    );
    setTimeout(() => ignoreMessage.delete().catch(console.error), 5000);
    return;
  }
  command.run(client, message, args);
}

// Function to get prefix
async function getPrefix(guildId) {
  return (await client.db8.get(`${guildId}_prefix`)) || st.info.prefix;
}

// Check if the message is from a bot or a DM
function isBotOrDM(message) {
  return message.author.bot || !message.guild;
}

// Function to get command and arguments
function getCommandAndArgs(message, prefix, noprefixed, np) {
  const regex = new RegExp(`^<@!?${client.user.id}>`);
  const pre = message.content.match(regex)
    ? message.content.match(regex)[0]
    : prefix;

  if (!noprefixed.includes(message.author.id) && !message.content.startsWith(pre))
    return null;

  return np.includes(message.author.id) === false
    ? message.content.slice(pre.length).trim().split(/ +/)
    : message.content.startsWith(pre)
    ? message.content.slice(pre.length).trim().split(/ +/)
    : message.content.trim().split(/ +/);
}

// Main event listener
client.on("messageCreate", async (message) => {
  try {
    if (isBotOrDM(message)) return;

    const isBlacklisted = await isUserInBlacklist(client, message.author.id);
    if (isBlacklisted) return;

    const prefix = await getPrefix(message.guild.id);
    const data = await client.db4.get(`members_np`);
    const noprefixed = data.noprefixlist || [];
    const np = [...noprefixed];

    const args = getCommandAndArgs(message, prefix, noprefixed, np);
    if (!args) return;

    await handleCommand(client, message, args);
  } catch (error) {
    console.error("An error occurred:", error);
  }
});
