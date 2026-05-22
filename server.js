const express = require('express');
const axios = require('axios');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.set('json spaces', 2);
app.use(express.static(__dirname + '/public'));

const PY_SCRIPT = path.join(__dirname, 'fb_download.py');
const COOKIES_FILE = path.join(__dirname, 'cookies.txt');

async function fetchViaYtDlp(url) {
  return new Promise((resolve, reject) => {
    const args = ['fb_download.py', url];
    const child = execFile('python', args, { cwd: __dirname, timeout: 30000 }, (err, stdout) => {
      if (err) return reject(new Error(`yt-dlp failed: ${err.message}`));
      try {
        const result = JSON.parse(stdout);
        if (result.error) return reject(new Error(result.error));
        resolve(result);
      } catch {
        reject(new Error('Failed to parse yt-dlp output'));
      }
    });
  });
}

async function fetchViaScraper(url) {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 15000,
  });

  const title = (data.match(/<meta\s+property="og:title"\s+content="([^"]+)"/) ||
                 data.match(/title">([^<]+)</) ||
                 [null, 'Facebook Video'])[1];

  const thumbnail = (data.match(/<meta\s+property="og:image"\s+content="([^"]+)"/) || [null, ''])[1];
  const hd = data.match(/hd_src:"([^"]+)"/)?.[1] || data.match(/playable_url_quality_hd:"([^"]+)"/)?.[1] || '';
  const sd = data.match(/sd_src:"([^"]+)"/)?.[1] || data.match(/playable_url:"([^"]+)"/)?.[1] || '';

  if (!hd && !sd) throw new Error('No downloadable video found. Facebook now requires login. See instructions below.');
  return {
    results: {
      title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
      thumbnail,
      quality: { sd, hd }
    }
  };
}

function getCookieHelp() {
  return {
    has_cookies: fs.existsSync(COOKIES_FILE),
    cookies_file: COOKIES_FILE,
    instructions: 'To download Facebook videos:\n' +
      '1. Install "Get cookies.txt" Chrome extension\n' +
      '2. Log in to Facebook in Chrome\n' +
      '3. Click the extension icon and export cookies\n' +
      '4. Save the file as "cookies.txt" in this project folder\n' +
      '5. Close Chrome and restart the server\n' +
      'OR close Chrome first, then yt-dlp can auto-read cookies'
  };
}

app.get('/fbdown', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ err: 'Please provide a Facebook link' });

  try {
    const result = await fetchViaYtDlp(url);
    return res.json(result);
  } catch (ytErr) {
    try {
      const result = await fetchViaScraper(url);
      return res.json(result);
    } catch (scrapeErr) {
      const msg = scrapeErr.response?.status === 404
        ? 'Video not found or inaccessible (404). Make sure the URL is correct and the video is public.'
        : scrapeErr.message.includes('login')
          ? 'Facebook now requires login to access videos.'
          : scrapeErr.message;
      console.error('Both methods failed');
      console.error('  yt-dlp:', ytErr.message);
      console.error('  scraper:', scrapeErr.message);
      res.status(500).json({
        error: 'Failed to fetch video details.',
        details: msg,
        help: getCookieHelp()
      });
    }
  }
});

app.get('/download', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Please provide a video URL' });

  try {
    const response = await axios({ method: 'GET', url, responseType: 'stream', timeout: 30000 });
    const uniqueId = Date.now();
    res.setHeader('Content-Disposition', `attachment; filename="facebook_video_${uniqueId}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    response.data.pipe(res);
  } catch (error) {
    const msg = error.response?.status === 404
      ? 'Video URL expired or not found. Try fetching video info again.'
      : error.message;
    console.error('Download error:', msg);
    res.status(500).json({ error: 'Failed to download video', details: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
