const name = "shoti";
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name,
  description: "Download a video using the Shoti API and send it to the user",
  async run({ api, event, send, args }) {
    const prompt = args.join(" ");
    if (!prompt) return send(`Please provide a valid URL. 

Example: ${api.prefix + name} <video-url>`);

    send("Processing your request, please wait... 🔎");

    try {
      // Call Shoti API to get video details
      const response = await axios.get(`https://api.shoti.com/get-video`, {
        params: {
          url: prompt,
        },
      });

      if (response.data.status) {
        const videoUrl = response.data.videoDownloadLink;
        const videoTitle = response.data.title;

        // Create a temporary file path
        const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-shoti.mp4`);

        // Download the video to the temporary file
        const videoStream = await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream",
        });

        // Pipe the video stream to the temporary file
        const writeStream = fs.createWriteStream(tempFilePath);
        videoStream.data.pipe(writeStream);

        // After the video is downloaded, send it as an attachment
        writeStream.on("finish", () => {
          api.sendMessage(
            {
              body: `Here is your video: ${videoTitle}`,
              attachment: fs.createReadStream(tempFilePath),
              type: "video",
            },
            event.threadID,
            () => {
              // Clean up the temporary file after sending
              fs.unlinkSync(tempFilePath);
            }
          );
        });
      } else {
        send("Failed to download video. Please try again with a valid link.");
      }
    } catch (error) {
      send(`An error occurred: ${error.message}`);
    }
  },
};
