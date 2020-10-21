const { app, BrowserWindow, net } = require('electron')
const path = require('path')
const sessions = require('./sessions.json')
const DiscordRPC = require('discord-rpc');

const clientId = '768012878887780362';
var activity = '';
let mainWindow;
DiscordRPC.register(clientId);
var details = 'LIVE SUMMIT';
var state = 'Watching the broadcast';
var largeImageKey = '';
var largeImageText = '';
var smallImageKey = '';
var smallImageText = '';

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.maximize();

  mainWindow.loadURL('https://events.bizzabo.com/233058/agenda')
  mainWindow.webContents.on('did-navigate-in-page', function (evt, url) {
    console.log(url)
    if (url.includes('https://events.bizzabo.com/233058/agenda/session/')) {
      var pathname = new URL(url).pathname;
      var paths = pathname.split('/')
      let session = sessions.sessions.find(el => el.id === parseInt(paths[4]));
      console.log(session.title);
      var speakerId = session.speakers[0].speakerId;
      const request = net.request('https://api.bizzabo.com/api/v2/agenda/events/233058/speakers/' + speakerId)
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          // clearInterval(activity);
          var speaker = JSON.parse(chunk.toString())
          console.log(speaker.firstname)
          details = session.title;
          state =  'Watching the broadcast';
          largeImageKey = speakerId.toString();
          largeImageText = speaker.firstname + " " + speaker.lastname;
          smallImageKey = 'altiumlive_logo';
          smallImageText = 'LIVE SUMMIT'
          rpc.setActivity({
            details: details,
            state: state,
            startTimestamp,
            largeImageKey: largeImageKey,
            largeImageText: largeImageText,
            smallImageKey: smallImageKey,
            smallImageText: smallImageText,
            instance: false,
          });
        })
      })
      request.end()
    } else {
      details = 'LIVE SUMMIT';
      state = 'Watching the broadcast';
      largeImageKey = '';
      largeImageText = '';
      smallImageKey = '';
      smallImageText = '';
      rpc.setActivity({
        details: details,
        state: state,
        startTimestamp,
        largeImageKey: largeImageKey,
        largeImageText: largeImageText,
        smallImageKey: smallImageKey,
        smallImageText: smallImageText,
        instance: false,
      });
    }
  });
}
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

async function setActivity() {
  if (!rpc || !mainWindow) {
    return;
  }
  rpc.setActivity({
    details: details,
    state: state,
    startTimestamp,
    largeImageKey: largeImageKey,
    largeImageText: largeImageText,
    smallImageKey: smallImageKey,
    smallImageText: smallImageText,
    instance: false,
  });
}

rpc.on('ready', () => {
  setActivity();
  activity = setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.login({ clientId }).catch(console.error);