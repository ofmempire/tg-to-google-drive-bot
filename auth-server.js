import express from 'express';
import open from 'open';
import { google } from 'googleapis';

const app = express();
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file']
    });
    open(authUrl);
    res.send('Authentication started, please follow the browser instructions.');
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log(`Refresh Token: ${tokens.refresh_token}`);
    res.send('Authentication successful! You can close this window.');
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
