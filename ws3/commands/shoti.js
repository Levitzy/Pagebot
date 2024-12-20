const axios = require("axios");
const path = require("path");
const os = require("os");
const fs = require("fs");

const name = "shoti";

module.exports = {
  name,
  description: "Sends a random Shoti video.",
  async run({ api, send, args }) {
    try {
      // Notify the user that the download is starting
      await send("Downloading random Shoti video. Please wait...");

      // Fetch random Shoti video data
      let response;
      try {
        response = await axios.get(
          "https://shoti.kenliejugarap.com/getvideo.php?apikey=YOUR_API_KEY"
        );
      } catch (error) {
        console.error("Error fetching video data:", error.response ? error.response.data : error.message);
        await send("Failed to fetch video data. Please try again later.");
        return;
      }

      // Check if the response status is valid and video data is available
      if (response.data && response.data.status) {
        const videoUrl = response.data.videoDownloadLink;
        const videoTitle = response.data.title;

        // Create a temporary file path in the system temp directory
        const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-shoti.mp4`);

        // Download the video to the temporary file
        let videoStream;
        try {
          videoStream = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream",
          });
        } catch (error) {
          console.error("Error downloading video:", error.response ? error.response.data : error.message);
          await send("Failed to download video. Please try again later.");
          return;
        }

        // Write the video stream to the temporary file
        const writer = fs.createWriteStream(tempFilePath);
        videoStream.data.pipe(writer);

        // Wait for the download to finish
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        // Send the video as an attachment
        await send({
          attachment: {
            type: "video",
            payload: fs.createReadStream(tempFilePath),
          },
        });

        // Delete the temporary file after sending
        fs.unlinkSync(tempFilePath);
      } else {
        console.error("Invalid response data:", response.data);
        await send("Failed to fetch the Shoti video. Please try again later.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      await send("An error occurred while processing your request.");
    }
  },
};
