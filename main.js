const { exec, spawn } = require("child_process");
const fs = require("fs");
const SCRIPT_FILE = "page_bot.js";
const SCRIPT_PATH = __dirname + "/" + SCRIPT_FILE;

async function Load() {
  const execute = async (cmd) => {
    await new Promise(async (resolve, reject) => {
      const buang = await exec(cmd, {
          cwd: __dirname,
          stdio: "inherit",
          shell: true
        },
        (async (error, stdout, stderr) => {
          if (error) return console.error(error);
          if (stdout) return console.error(stdout);
          if (stderr) return console.error(stderr);
          resolve();
          return;
        }));
    });
  };

  const execute1 = async (cmd, args) => {
    await new Promise((resolve, reject) => {
      let main_ = spawn(cmd, args, {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
      });
      main_.on("data", async (data) => {
        console.log(data);
      });
      main_.on("close", async (exitCode) => {
        if (exitCode === 0) {
          console.log(`Success: code ${exitCode}`);
        } else if (exitCode === 1) {
          console.log(`Error: code ${exitCode}`);
          console.log(`Restarting WSE PageBot...`);
          Load()f DD dzE
        } else {
          console.log(`Error: code ${exitCode}`);
        }
        resolve();
        return;
      });
    });
  };

  console.log("Done!") 

  // Start the local web server
  await execute1(`node`, [SCRIPT_PATH]);

  return;
}

Load();

process.on("unhandledRejection", reason => console.log(reason));