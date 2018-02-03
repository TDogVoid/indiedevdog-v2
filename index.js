const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow, ipcMain } = electron;

const twitterAPI = require('./scripts/twitterAPI');
const classify = require('./scripts/classify.js');
const spamScore = require('./scripts/spamScore.js');
const TweetsFile = require('./scripts/tweets.js');
const UserData = require('./scripts/userData.js');

let mainWindow;
let TweetsData = [];

app.on('ready', () => {
  mainWindow = new BrowserWindow({});
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    })
  );
  // mainWindow.webContents.openDevTools();
  load();
});

function GetIndexById(arr, id) {
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i].id === id) {
      return i;
    }
  }
  return -1;
}

async function removeFromArray(arr, item) {
  const i = await GetIndexById(arr, item.id);
  if (i !== -1) {
    arr.splice(i, 1);
  }
}

function save() {
  TweetsFile.save(TweetsData);
}

function precisionRound(number, precision) {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

function SendTweets() {
  mainWindow.webContents.send('Tweets:Data', TweetsData);
}

function getLastID() {
  let last = UserData.getLastID();
  if (TweetsData.length > 0) {
    for (let i = 0; i < TweetsData.length; i += 1) {
      if (TweetsData[i].id > last) {
        last = TweetsData[i].id;
      }
    }
    UserData.setLastID(last);
    return last;
  }
  return null;
}

ipcMain.on('Tweets:Get', (event) => {
  twitterAPI.SearchTwitter(getLastID(), (Tweets) => {
    SaveTweets(Tweets);

    getLastID();
  });
});

function GetAccuracy() {
  classify.GetAccuracy((err, score) => {
    if (err) {
      console.log(err);
      return;
    }
    const precScore = precisionRound(score, 2) * 100;
    mainWindow.webContents.send('Classifier:Accuracy', precScore);
  });
}

function UnpackToTweetsData(Tweets) {
  for (let i = 0; i < Tweets.length; i += 1) {
    TweetsData.push(Tweets[i]);
  }
}

function SetClassify(tweet) {
  tweet.ClassifiedType = classify.classify(tweet.full_text);
}

async function reclassify() {
  await TweetsData.forEach((tweet) => {
    SetClassify(tweet);
  });
  save();
  SendTweets();
  GetAccuracy();
}

async function SaveTweets(Tweets) {
  await UnpackToTweetsData(Tweets);
  await TweetsFile.save(TweetsData);
  SendTweets();
}

async function MarkSpam(tweet) {
  await removeFromArray(TweetsData, tweet);
  await classify.markSpam(tweet.full_text);
  reclassify(); // eslint-disable-line no-use-before-define
}

async function MarkHam(tweet) {
  await removeFromArray(TweetsData, tweet);
  await classify.markHam(tweet.full_text);
  reclassify(); // eslint-disable-line no-use-before-define
}

ipcMain.on('Tweet:MarkSpam', (event, tweet) => {
  MarkSpam(tweet);
});

ipcMain.on('Tweet:MarkHam', (event, tweet) => {
  MarkHam(tweet);
});

async function SetSpamScore(tweet, Score) {
  const i = await GetIndexById(TweetsData, tweet.id);
  TweetsData[i].user.spamScore = Score;
  save();
  SendTweets();
}

ipcMain.on('User:GetSpamScore', (event, tweet) => {
  spamScore.GetScore(tweet.user.screen_name, (err, Score) => {
    if (err) {
      console.log(err);
      return;
    }
    SetSpamScore(tweet, Score);
  });
});

function load() {
  classify.load(() => {
    TweetsFile.load((err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      TweetsData = data;
    });
  });
}

ipcMain.on('Config:TwitterKeys', (event, Keys) => {
  UserData.setTwitterKeys(Keys);
});

ipcMain.on('Tweets:GetData', (event) => {
  SendTweets();
  GetAccuracy();
});
