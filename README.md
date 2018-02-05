# Discord Auto-grouping

## Original by CritCola

Discord Auto-grouping is a Discord bot that uses discord.js to automatically group users into "subchannels" in Discord servers, eliminating the need for creating numerous group channels. It was developed out of necessity for Crit Cola to mitigate two major pitfalls with Discord: their lack of subchannels and temporary channels.

When a user enters a channel prefixed with a game controller emoji (🎮), they'll be automatically grouped into their own "subchannel" where they can be joined by the rest of their group. When the group channel empties, it will be immediately deleted.

## Fork by Cludch

I removed some unneeded code and added a few things. First of all, the newly created channel requires a specific group (`NewBees`) in order to be joined, hence our Discord
is used privately only.

The newly created channels will be added to the `Gaming` category, whose ID is being determined upon start. I modified the channel names a little, but nothing special.

Last worth mentioning: This is just a quick and dirty hack. Still a few hard-coded things, but it does its job, even though we don't really need that.. Now we do!

## Installation

Run `npm i` or `yarn` to install the dependencies. Then copy the `config.example.js` to `config.js` and change the values.
Finally, start the bot using `npm start` or `yarn start`. For persistence, I can recommend [PM2](https://github.com/Unitech/pm2).
