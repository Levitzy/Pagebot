const axios = require('axios');
const fs = require('fs');
const path = require('path');

let isProcessing = false;

const name = "shoti";

module.exports = {
  name,
  description: "Send a random Shoti video",
  async run({ api, event, send }) {
    const { threadID, messageID } = event;
    const filePath = path.join(__dirname, 'shoti.mp4');

    // Prevent multiple command executions simultaneously
    if (isProcessing) {
      return send("The command is already in use. Please wait until the current process finishes.");
    }

    isProcessing = true;

    try {
      // Notify user that the video is being downloaded
      await send("Downloading random Shoti video. Please wait...");

      // Fetch random Shoti video data
      const response = await axios.get('https://shoti.kenliejugarap.com/getvideo.php?apikey=shoti-0763839a3b9de35ae3da73816d087d57d1bbae9f8997d9ebd0da823850fb80917e69d239a7f7db34b4d139a5e3b02658ed26f49928e5ab40f57c9798c9ae7290c536d8378ea8b01399723aaf35f62fae7c58d08f04');

      if (response.data.status) {
        const videoUrl = response.data.videoDownloadLink;
        const videoTitle = response.data.title;

        // Download the video
        const videoStream = await axios({
          url: videoUrl,
          method: 'GET',
          responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        videoStream.data.pipe(writer);

        // Wait for the video to finish downloading
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Send the video as a new message with the title
        await send({
          body: `Here is the Shoti video: ${videoTitle}`,
          attachment: fs.createReadStream(filePath)
        });

        // Delete the temporary video file
        fs.unlinkSync(filePath);
      } else {
        // Notify user of failure
        await send("Failed to fetch Shoti video. Please try again.");
      }
    } catch (error) {
      // Handle any errors during the process
      console.error("Error while fetching the Shoti video:", error);
      await send("An error occurred while fetching the Shoti video.");
    } finally {
      isProcessing = false;
    }
  }
};
