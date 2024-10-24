const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os'); // For using the system's temporary directory

let isProcessing = false;

const name = "shoti";

module.exports = {
    name,
    description: "Send a random Shoti video",
    async run({ api, event, send, args }) {
        const chatId = event.threadID;
        const messageId = event.messageID;
        const tempDir = os.tmpdir(); // Get the system temp directory
        const filePath = path.join(tempDir, `shoti_${Date.now()}.mp4`); // Create a unique temp file

        if (isProcessing) {
            return send("The command is already in use. Please wait until the current process finishes.");
        }

        isProcessing = true;

        try {
            // Notify the user that the video is being downloaded
            const sentMessage = await send("Downloading random Shoti video. Please wait...");

            // Log sentMessage to verify the structure and confirm if message_id is present
            console.log("Sent Message:", sentMessage);

            // Fetch the Shoti video URL from the API
            const response = await axios.get('https://shoti.kenliejugarap.com/getvideo.php?apikey=shoti-0763839a3b9de35ae3da73816d087d57d1bbae9f8997d9ebd0da823850fb80917e69d239a7f7db34b4d139a5e3b02658ed26f49928e5ab40f57c9798c9ae7290c536d8378ea8b01399723aaf35f62fae7c58d08f04');

            if (response.data.status && response.data.videoDownloadLink) {
                const videoUrl = response.data.videoDownloadLink;
                const videoTitle = response.data.title || 'No Title';

                // Stream the video from the URL and save it to a temporary file
                const videoStream = await axios({
                    url: videoUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(filePath);
                videoStream.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // Send the Shoti video to the chat using the file as attachment
                const sentVideoMessage = await api.sendMessage(chatId, `Here is the Shoti video: ${videoTitle}`, {
                    attachments: [
                        {
                            type: 'video',
                            path: filePath  // Path to the downloaded video file
                        }
                    ]
                });

                // Log the response of the video message to ensure it's sent
                console.log("Sent Video Message:", sentVideoMessage);

                // Unsend the initial "Downloading..." message, check that sentMessage contains message_id
                if (sentMessage && sentMessage.message_id) {
                    await api.deleteMessage(chatId, sentMessage.message_id);
                } else {
                    console.error("Error: message_id is missing from the sentMessage response.");
                }

                // Remove the video file after sending
                fs.unlinkSync(filePath);

            } else {
                // If API returns no video link or status is false
                throw new Error("Failed to fetch Shoti video. Invalid API response.");
            }

        } catch (error) {
            console.error("Error while fetching the Shoti video:", error);

            if (error.response && error.response.status === 404) {
                await send("Error: The requested Shoti video could not be found.");
            } else {
                await send("An error occurred while fetching the Shoti video.");
            }

        } finally {
            // Cleanup if file still exists
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // Ensure temp file is deleted
            }
            isProcessing = false;
        }
    }
};