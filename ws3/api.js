const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Environment variables or default values
const token = "EAASBAxPRlf4BO96SERwcCiNGpbI1WdRORX5wwf40nrLZBwpBXThNzxxxgalZCrHyP2Y0iKb6ho7L5XXtqB1VCrd7adPoCwFWNGQ8wi2JVFrlrokHlIMgOZARifqPi15DKsEbZBaTfHjwiBf4TO30VB1sOYSm5iL7KrsQloDggxnk1jXWdrQVprhqyzv0E7vq";
const PAGE_ACCESS_TOKEN = process.env.token || token;

// Directory paths
const cmdLoc = path.join(__dirname, "commands");
const temp = path.join(__dirname, "temp");

// Command management
const prefix = "/";
const commands = [];
const descriptions = [];

module.exports = {
  PAGE_ACCESS_TOKEN,
  
  // Load commands dynamically from the commands folder
  async loadCommands() {
    const commandsPayload = [];
    fs.readdir(cmdLoc, async (err, files) => {
      if (err) return console.error("Error reading commands directory:", err);
      
      for await (const name of files) {
        const commandFile = require(path.join(cmdLoc, name));
        const commandName = commandFile.name || name.replace(".js", "").toLowerCase();
        const description = commandFile.description || "No description provided.";
        
        commands.push(commandName);
        descriptions.push(description);
        commandsPayload.push({ name: `${prefix + commandName}`, description });
        console.log(`${commandName} loaded`);
      }

      console.log("Loading command payload...");

      // Get current commands from the Facebook API
      const dataCmd = await axios.get(`https://graph.facebook.com/v21.0/me/messenger_profile`, {
        params: {
          fields: "commands",
          access_token: PAGE_ACCESS_TOKEN
        }
      });

      if (dataCmd.data.data?.[0]?.commands?.length === commandsPayload.length) {
        return console.log("Commands not changed");
      }

      // Update commands via the Facebook API
      const loadCmd = await axios.post(`https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`, {
        commands: [{ locale: "default", commands: commandsPayload }]
      }, {
        headers: { "Content-Type": "application/json" }
      });

      if (loadCmd.data.result === "success") {
        console.log("Commands loaded successfully!");
      } else {
        console.log("Failed to load commands");
      }
    });
  },
  
  // Command and description lists
  commands,
  descriptions,
  cmdLoc,
  temp,
  prefix,
  
  // Admin user list
  admin: ["1224413325558445"],
  
  // Send a message (supports text, image, video, file)
  async sendMessage(senderId, message, pageAccessToken = PAGE_ACCESS_TOKEN, type = 'text', attachmentUrl = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // Construct message payload based on type
        let messagePayload = {};
        if (type === 'text') {
          messagePayload = { text: message };
        } else if (['image', 'video', 'file'].includes(type) && attachmentUrl) {
          messagePayload = {
            attachment: {
              type: type,
              payload: {
                url: attachmentUrl,
                is_reusable: true
              }
            }
          };
        } else {
          throw new Error('Invalid message type or missing attachment URL');
        }

        // Send the message through the Facebook API
        const sendMsg = await axios.post(`https://graph.facebook.com/v21.0/me/messages`, {
          recipient: { id: senderId },
          message: messagePayload
        }, {
          params: { access_token: pageAccessToken },
          headers: { "Content-Type": "application/json" }
        });

        if (sendMsg.data.error) {
          console.error('Error sending message:', sendMsg.data.error);
          return reject(sendMsg.data.error);
        }

        resolve(sendMsg.data);
      } catch (error) {
        console.error('Error in sendMessage:', error);
        reject(error);
      }
    });
  },
  
  // Publish a post to the Facebook page
  async publishPost(message, access_token = PAGE_ACCESS_TOKEN) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await axios.post(`https://graph.facebook.com/v21.0/me/feed`, {
          message,
          access_token
        }, {
          params: { access_token },
          headers: { "Content-Type": "application/json" }
        });

        if (!res) return reject(new Error("Failed to publish post"));
        resolve(res.data);
      } catch (error) {
        console.error("Error in publishPost:", error);
        reject(error);
      }
    });
  },
  
  // Bot introduction message
  introduction: `Hello, I am WieAI and I am your assistant.
Type ${prefix}help for available commands.

Note: WieAI is highly recommended to use Messenger because some features won't work and are limited.
🤖 Created by Neth Aceberos`,
  
  // External APIs
  api_josh: "https://deku-rest-apis.ooguy.com",
  echavie: "https://echavie3.nethprojects.workers.dev"
};
