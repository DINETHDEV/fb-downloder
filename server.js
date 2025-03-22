const express = require('express');
const Facebook = require('facebook-dl');
const axios = require('axios');
const app = express();
const PORT = 3000;
const api = new Facebook();

app.set('json spaces', 2);
app.use(express.static(__dirname + '/public'));

app.get('/fbdown', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ err: 'Please provide a Facebook link' });
    }

    try {
        const videoInfo = await api.fbdl(url);
        res.json(videoInfo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video details.', details: error.message });
    }
});

app.get('/download', async (req, res) => {
    const { url, quality, filename } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'Please provide a video URL' });
    }
    
    try {
        // Get the video as a stream
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });
        
        // Set content disposition and type headers
        const videoFilename = filename || 'facebook_video';
        const uniqueId = Date.now();
        res.setHeader('Content-Disposition', `attachment; filename="${videoFilename}_${uniqueId}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        
        // Pipe the video stream to the response
        response.data.pipe(res);
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ error: 'Failed to download video', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});