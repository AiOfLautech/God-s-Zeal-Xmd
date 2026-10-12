const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../../lib/isOwner');
const { sendStyled } = require('../../lib/menuLayout');
const { getPrefix } = require('../../lib/botConfig');

// Path to store auto status configuration
const configPath = path.join(__dirname, '../../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false 
    }));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!msg.key.fromMe && !isOwner) {
            await sendStyled(sock, chatId, msg, {
                title: 'AUTOSTATUS',
                lines: ['This command can only be used by the owner.']
            });
            return;
        }

        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath));

        // If no arguments, show current status
        if (!args || args.length === 0) {
            const status = config.enabled ? 'enabled' : 'disabled';
            const reactStatus = config.reactOn ? 'enabled' : 'disabled';
            const prefix = getPrefix();
            await sendStyled(sock, chatId, msg, {
                title: 'AUTOSTATUS',
                lines: [
                    `Auto Status View ☇ ${status}`,
                    `Status Reactions ☇ ${reactStatus}`,
                    `${prefix}autostatus on`,
                    `${prefix}autostatus off`,
                    `${prefix}autostatus react on`,
                    `${prefix}autostatus react off`
                ]
            });
            return;
        }

        // Handle on/off commands
        const command = args[0].toLowerCase();
        
        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sendStyled(sock, chatId, msg, {
                title: 'AUTOSTATUS',
                lines: ['Auto status view has been enabled.']
            });
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sendStyled(sock, chatId, msg, {
                title: 'AUTOSTATUS',
                lines: ['Auto status view has been disabled.']
            });
        } else if (command === 'react') {
            if (!args[1]) {
                await sendStyled(sock, chatId, msg, {
                    title: 'AUTOSTATUS',
                    lines: [`Usage ☇ ${getPrefix()}autostatus react on/off`]
                });
                return;
            }
            const reactCommand = args[1].toLowerCase();
            if (reactCommand === 'on') {
                config.reactOn = true;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sendStyled(sock, chatId, msg, {
                    title: 'AUTOSTATUS',
                    lines: ['Status reactions have been enabled.']
                });
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sendStyled(sock, chatId, msg, {
                    title: 'AUTOSTATUS',
                    lines: ['Status reactions have been disabled.']
                });
            } else {
                await sendStyled(sock, chatId, msg, {
                    title: 'AUTOSTATUS',
                    lines: [`Usage ☇ ${getPrefix()}autostatus react on/off`]
                });
            }
        } else {
            await sendStyled(sock, chatId, msg, {
                title: 'AUTOSTATUS',
                lines: [
                    `${getPrefix()}autostatus on/off`,
                    `${getPrefix()}autostatus react on/off`
                ]
            });
        }
    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sendStyled(sock, chatId, msg, {
            title: 'AUTOSTATUS',
            lines: ['Error occurred while managing auto status.']
        });
    }
}

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.reactOn;
    } catch (error) {
        console.error('Error checking status reaction config:', error);
        return false;
    }
}

// Function to react to status using proper method
async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) {
            return;
        }

        // Use the proper relayMessage method for status reactions
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
        
        // Removed success log - only keep errors
    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

// Function to handle status updates
async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) {
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    const sender = msg.key.participant || msg.key.remoteJid;
                    
                    // React to status if enabled
                    await reactToStatus(sock, msg.key);
                    
                    // Removed success log - only keep errors
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                const sender = status.key.participant || status.key.remoteJid;
                
                // React to status if enabled
                await reactToStatus(sock, status.key);
                
                // Removed success log - only keep errors
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.reaction.key]);
                const sender = status.reaction.key.participant || status.reaction.key.remoteJid;
                
                // React to status if enabled
                await reactToStatus(sock, status.reaction.key);
                
                // Removed success log - only keep errors
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.reaction.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
}; 

