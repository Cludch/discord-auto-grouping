const Discord = require('discord.js');
const config = require('./config');

const client = new Discord.Client();
const token = config.token;
const guildId = config.guildId;
const channelStart = String.fromCodePoint(config.channelStart);

// Determined at runtime
let guild;
let defaultRoleId;
let gamesCategoryId;
let voiceCategoryId;

// Connect and perform routine maintenance.
client.on('ready', () => {
	console.log('[' + new Date().toISOString() + '] Connected!');

	// Set the online status.
	client.user.setStatus('online');
	client.user.setActivity(config.activity);

	guild = client.guilds.get(guildId);

	const roles = guild.roles;
	for (const roleId of roles.keys()) {
		const role = roles.get(roleId);
		if (role.name === '@everyone') {
			defaultRoleId = role.id;
			console.log(`Set @everyone id to ${defaultRoleId}`)
		}
	}

	for (const channelId of client.channels.keys()) {
		const channel = client.channels.get(channelId);
		if (channel.constructor.name === 'CategoryChannel') {
			if (channel.name.startsWith(channelStart)) {
				gamesCategoryId = channel.id;
				console.log(`Set games category id to ${gamesCategoryId} with name ${channel.name}`)
			} else if (channel.name.includes('Voice')) {
				voiceCategoryId = channel.id;
				console.log(`Set voice category id to ${voiceCategoryId} with name ${channel.name}`)
			}
		} 
	}

	// Delete all old channels with no members,
	// which sit under the gaming category and start with the emoji in case there are permanent channel.
	for (const channelId of client.channels.keys()) {
		const channel = client.channels.get(channelId);
		if (channel.type !== 'voice') continue;

		if (channel.parentID === gamesCategoryId
			&& channel.name.startsWith(channelStart)
			&& channel.members.size === 0) {
				channel.delete().then(() => console.log('Deleted voice channel ' + channel.name));
			}
	}
});

client.on('error', err => console.error(err));

// Trigger on VOICE_STATE_UPDATE events.
client.on('voiceStateUpdate', (oldMember, member) => {
	// Check if the user entered a new channel.
	if (member.voiceChannelID) {
		const newChannel = member.guild.channels.get(member.voiceChannelID);

		// If the user entered a game channel (prefixed with a game controller unicode emoji), group them into their own channel.
		if (newChannel.name.startsWith(channelStart) && newChannel.parentID === voiceCategoryId) {
			newChannel.clone(`${newChannel.name} ${member.displayName}`, false)
				.then(createdChannel => {
					createdChannel.setParent(gamesCategoryId)
						.then(createdChannel => {
							const permissionPromises = [];

							for (const [key, permissionOverwrite] of newChannel.permissionOverwrites) {
								const roleId = permissionOverwrite.id;
								if (roleId === defaultRoleId) continue;
								permissionPromises.push(createdChannel.overwritePermissions(guild.roles.get(roleId), {
									VIEW_CHANNEL: true,
									CONNECT: true,
									SPEAK: true,
									USE_VAD: true
								}));
							}

							// Move the user into the channel *after* setting all permissions. This caused a race condition earlier.
							Promise.all(permissionPromises).then(() => {
								member.setVoiceChannel(createdChannel);
								console.log('[' + new Date().toISOString() + '] Moved user "' + member.user.username + '#' + member.user.discriminator + '" ('
									+ member.user.id + ') to ' + createdChannel.type + ' channel "' + createdChannel.name
									+ '" (' + createdChannel.id + ') at position ' + createdChannel.position)
							}).catch(console.error);
						})
				}).catch(console.error);
		}
	}

	// Check if the user came from another channel.
	if (oldMember.voiceChannelID) {
		const oldChannel = oldMember.guild.channels.get(oldMember.voiceChannelID);

		// Just some sanity checks.
		if (typeof oldChannel === 'undefined') return;

		// Delete the user's now empty temporary channel, if applicable.
		if (oldChannel.name.startsWith(channelStart) && oldChannel.parentID === gamesCategoryId && !oldChannel.members.array().length) {
			oldChannel.delete().then(() => console.log('[' + new Date().toISOString() + '] Deleted '
				+ oldChannel.type + ' channel "' + oldChannel.name + '" (' + oldChannel.id + ')'))
				.catch(console.error);
		}
	}
});

client.login(token);
