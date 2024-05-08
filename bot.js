import { Telegraf } from 'telegraf';
import fs from 'fs';
import fetch from 'node-fetch';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const debug = process.env.DEBUG === 'TRUE';

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});

const ignoredTopics = ["WEEKLY CONTENT PLAN", "General"]; // Topics to ignore, add your own, it's based on the name of the topic

bot.on('message', async (ctx) => {
    try {
        const topic = ctx.update.message.reply_to_message ? ctx.update.message.reply_to_message.forum_topic_created.name : null;
        const title = ctx.update.message.chat.title;

        if (debug) console.log(`Received a message in ${title} under the topic ${topic}`);

        if (topic && !ignoredTopics.includes(topic)) {
            const path = `${title}/${topic}`;
            const folderId = await ensureDriveFolder(path);

            // Determine the file with the largest size or a document (photos send 4 different sized images, we only need the largest one)
            let largestFile = null;
            if (ctx.update.message.photo) {
                largestFile = ctx.update.message.photo.reduce((prev, current) => (prev.file_size > current.file_size) ? prev : current);
            } else if (ctx.update.message.video) {
                largestFile = ctx.update.message.video;
            } else if (ctx.update.message.document) {
                largestFile = ctx.update.message.document;
            }

            if (largestFile) {
                const file_id = largestFile.file_id;
                const extension = largestFile.file_name ? largestFile.file_name.split('.').pop() : (ctx.update.message.photo ? 'jpg' : 'mp4');
                const fileName = `${Date.now()}.${extension}`;

                if (debug) console.log(`Processing file ${fileName}`);

                // Fetch file path from Telegram
                const res = await bot.telegram.getFile(file_id);
                const file_path = res.file_path;

                // Download the file
                const response = await fetch(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`);
                const buffer = await response.buffer();

                // Save the file locally
                const filePath = `${path}/${fileName}`;
                if (!fs.existsSync(path)) {
                    fs.mkdirSync(path, { recursive: true });
                }
                fs.writeFileSync(filePath, buffer);

                if (debug) console.log(`File saved locally at ${filePath}`);

                // Upload to Google Drive
                await uploadFileToDrive(filePath, folderId, fileName);

                if (debug) console.log(`File uploaded to Google Drive`);

                // Delete the local file
                fs.unlinkSync(filePath);

                if (debug) console.log(`Local file deleted`);
            }
        } else if (debug) {
            console.log(`Ignored topic ${topic}`);
        }
    } catch (error) {
        console.error(`Error handling the file: ${error}`);
        ctx.reply(`Error: ${error.message}`);
    }
});
async function ensureDriveFolder(folderPath) {
    if (debug) console.log(`Ensuring existence of folder: ${folderPath}`);

    // Ensure "OnlyFans Content" folder exists at the root level (change the name OnlyFans Content to your desired folder name)
    let parentId = await ensureSpecificFolder('OnlyFans Content', 'root'); 

    const parts = folderPath.split('/');

    for (const part of parts) {
        const response = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${part}' and '${parentId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (response.data.files.length === 0) {
            const fileMetadata = {
                name: part,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId]
            };
            const folder = await drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            parentId = folder.data.id;
            if (debug) console.log(`Folder created: ${part} with ID ${parentId}`);
        } else {
            parentId = response.data.files[0].id;
            if (debug) console.log(`Folder exists: ${part} with ID ${parentId}`);
        }
    }

    return parentId;
}

async function ensureSpecificFolder(folderName, parentFolderId) {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId === 'root') {
        query += " and 'root' in parents";  // Ensure it's directly in the root
    } else {
        query += ` and '${parentFolderId}' in parents`;
    }

    const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
        pageSize: 10  // Ensuring not too many items can confuse the query
    });

    if (response.data.files.length === 0) {
        if (debug) console.log(`No existing '${folderName}' folder found at specified location, creating one.`);
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
        };
        const folder = await drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        return folder.data.id;
    } else {
        return response.data.files[0].id;  // Assuming the first found is correct
    }
}

async function uploadFileToDrive(filePath, folderId, name) {
    const fileMetadata = {
        name,
        parents: [folderId]
    };
    const media = {
        mimeType: filePath.endsWith('mp4') ? 'video/mp4' : (filePath.endsWith('jpg') ? 'image/jpeg' : `application/octet-stream`),
        body: fs.createReadStream(filePath)
    };
    await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id'
    });
}

bot.launch();
if (debug) console.log("Bot started successfully");
