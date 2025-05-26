const fs = require('fs');
const path = require('path');
const axios = require('axios');

function sanitizeFilename(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '');
}

async function getGameName(appid) {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}`;
    const res = await axios.get(url);
    const data = res.data[appid];

    if (data.success && data.data && data.data.name) {
      return data.data.name;
    }
    return null;
  } catch (err) {
    if (err.response && err.response.status === 429 && retries > 0) {
      console.warn(`⚠️ Rate limit for appid ${appid}. Retrying after delay...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getGameName(appid, retries - 1); 
    }

    console.error(`Failed to fetch name for appid ${appid}:`, err.message);
    return null;
  }
}

async function generateGameConfigs(folderPath, outputDir) {
  const folders = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isDirectory());

  for (const appid of folders) {
    if (!/^\d+$/.test(appid)) continue;

    console.log(`Processing AppID: ${appid}...`);
    const name = await getGameName(appid);

    if (name) {
      const fileName = sanitizeFilename(name) + '.json';
      const filePath = path.join(outputDir, fileName);

      if (fs.existsSync(filePath)) {
        console.info(`Config for "${name}" already exists. Skipping.`);
        continue;
      }

      const gameData = {
        name: sanitizeFilename(name),
        appid,
        config_path: "",
        save_path: folderPath,
        executable: "",
        arguments: "",
        process_name: ""
      };

      fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2));
      console.log(`Saved: ${filePath}`);
    }
  }

  console.log(`Done! JSON files saved to ${outputDir}`);
}


module.exports = { generateGameConfigs };
