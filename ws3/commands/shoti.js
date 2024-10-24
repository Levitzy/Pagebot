const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const name = "shoti";

module.exports = {
  name,
  description: "Send a random Shoti video",
  async run({ api, event, send }) {
    try {
      // Notify user that the video is being downloaded
      await send("Downloading random Shoti video. Please wait...");

      // Fetch random Shoti video data
      const response = await axios.get('https://shoti.kenliejugarap.com/getvideo.php?apikey=shoti-0763839a3b9de35ae3da73816d087d57d1bbae9f8997d9ebd0da823850fb80917e69d239a7f7db34b4d139a5e3b02658ed26f49928e5ab40f57c9798c9ae7290c536d8378ea8b01399723aaf35f62fae7c58d08f04');

      if (response.data.status) {
        const videoUrl = response.data.videoDownloadLink;
        const videoTitle = response.data.title;

        // Create a temporary file path in the system temp directory
        const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-shoti.mp4`);

        // Download the video to the temporary file
        const videoStream = await axios({
          url: videoUrl,
          method: 'GET',
          responseType: 'stream'
        });

        // Save the video to the temporary file
        const writer = fs.createWriteStream(tempFilePath);
        videoStream.data.pipe(writer);

        // Return a promise that resolves when the file is finished writing
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Send the video as an attachment
        const videoMessage = {
          attachment: fs.createReadStream(tempFilePath),
          type: 'video',
          body: `Here is your random Shoti video: ${videoTitle}`
        };

        await send(videoMessage);

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);
      } else {
        send("Failed to fetch a Shoti video. Please try again later.");
      }
    } catch (err) {
      send(`Error: ${err.message}`);
    }
  }
};
