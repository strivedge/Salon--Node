const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
var path = require('path').resolve('./'); //get main dir path

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

exports.uploadImageToDrive = async function (data) {
  try {
    fs.readFile(TOKEN_PATH, (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content), data, uploadFile);
    });
  } catch (e) {
    console.log("e ", e)
    console.log("\n\nUploading Issues on drive >>>>>>>>>>>>>>\n\n");
  }
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, data, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, data);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function uploadFile(auth, imageData) {
  const drive = google.drive('v3');

  const folderMetaData = {
    'name': imageData.booking_id,
    'mimeType': 'application/vnd.google-apps.folder',
    parents: ['1Kymj6yZIELzLnoagoexuAftBWo2_CqWq']
  }

  drive.files.create({
    auth: auth,
    resource: folderMetaData
  }, (err, data) => {
    if (err) {
      console.log("Error while Creating folder ", err);
    } else {
      console.log("Folder created!")
      for (var i = 0; i < imageData.images.length; i++) {
        const filesMetaData = {
          'name': imageData.images[i].image_name,
          parents: [data.data.id]
        }

        const media = {
          mimeType: 'image/*',
          body: fs.createReadStream(imageData.images[i].image)
        }

        drive.files.create({
          auth: auth,
          resource: filesMetaData,
          media: media
        }, err => {
          if (err) console.log("Drive Error ", err);
          else console.log('Uploaded!');
        });
      }
    }
  });
}