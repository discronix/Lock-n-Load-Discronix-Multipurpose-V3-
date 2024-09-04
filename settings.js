const prefix = process.env.prefix || '?'
const status = `${prefix}help`;

module.exports = {
  bot: {
    info: {
      prefix: '?',
      token: '',
      invLink: 'https://discord.com/oauth2/authorize?client_id=1269543625675640832',
      privacy: 'https://github.ccyPolicy.md',
      terms: 'https://github.com/Artions.md',
    },
    presence: {
      name: status,
      type: 'LISTENING',
      url: 'https://twitch.tv/pewdiepie'
    },
    credits: {
      developerId: '948937171031695411',
      supportServer: 'https://dsc.gg/discronix'
    },
  }
}
