# Prerequisites

Node.js: Ensure Node.js is installed. Download [here](https://nodejs.org/en)

Telegram Account: Required to create a bot and interact with it.

Google Account: Needed for Google Drive access.

Basic understanding of using command line interfaces.

  

## Step 1: Create a Telegram Bot

Start BotFather: In Telegram, search for "BotFather", start a conversation, and send the `/newbot` command.

  

Name Your Bot: Follow the prompts to name your bot and get a username.

  

Save the Token: BotFather will give you a token. This is your BOT_TOKEN. Add to .env file & keep it secure.

  

## Step 2: Set Up Google Cloud Project

Google Cloud Console: Go to Google Cloud Console, create a new project.

  

Enable Google Drive API: Navigate to "APIs & Services", search for "Google Drive API", and enable it.

  

Create Credentials:

Go to "Credentials" > "Create Credentials" > "OAuth client ID".

  

Choose "Web application", set a name, and under "Authorized redirect URIs" add http://localhost:3000/oauth2callback.

  

Save the generated CLIENT_ID and CLIENT_SECRET inside the .env file.

  

## Step 3: Obtain Google Drive Refresh Token

### Clone/download the project repository.

> git clone https://github.com/ofmempire/tg-to-google-drive-bot.git

### Navigate into the project directory.

`cd tg-to-google-drive-bot`

### Install Dependencies 

Run `npm install` to install dependencies.

### Set Up Environment Variables:

Create a .env file in the project root with the following variables:

Copy the following in a .env file:
```
BOT_TOKEN=your_bot_token_here

CLIENT_ID=your_client_id_here

CLIENT_SECRET=your_client_secret_here

REDIRECT_URI=http://localhost:3000/oauth2callback

DEBUG=TRUE // or FALSE if you prefer less verbose logs
```
### Run the Auth Server:

Start the authentication server with `node auth-server.js`.

Open http://localhost:3000/auth in a web browser to authenticate and authorize access to Google Drive.

Once completed, you'll receive a REFRESH_TOKEN in the **console**. Add this to your .env file, this is what will allow the bot to communicate with Google Drive.

## Step 4: Deploy the Bot

### Local Testing:

Run the bot locally using `node bot.js` to test if it's working correctly.

### Deployment Options:

**On a Local Machine:** Keep the bot running on a local machine with `node bot.js`

**Using a Cloud Server (e.g., DigitalOcean, AWS, Heroku):**

Transfer the project to a cloud server using SCP or Git.

`scp -r ./tg-to-google-drive-bot  root@your_droplet_ip:/root/`

Use pm2 to manage the bot process (`npm install pm2 -g`, `pm2 start bot.js`, `pm2 save`).

### Step 5: Interact with the Bot

Make a Telegram Topic Group.

Add the bot you made as an admin.

Name of Creator as the Title of the Group
  - SFW OF FEED
  - NSFW OF PPV
  - REELS
  - FEED
as the names of the TOPICS, feel free to add as many as you want. 

*do not use '/' or '&' in the topic names*

Additional Notes

**Security:** Keep all tokens and credentials secure. Do not share your .env file or include it in any public repository.

**20mb limit:** Telegram only allows to download up to 20mb from their API, so the bot will reply with 'File too big error'