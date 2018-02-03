const twitterAPI = require('./twitterAPI.js');
const UserData = require('./userData.js');
const classify = require('./classify.js');
const spamScore = require('./spamScore.js');

let blockedIDs = [];
let TweetsData = [];
const spamThreshold = 0.3;

function GetBlockedIDs(callback) {
  console.log('Getting BlockedIDs');
  twitterAPI.GetBlockedIDs((err, reply) => {
    if (err) return console.log(err);
    for (let i = 0; i < reply.users.length; i += 1) {
      blockedIDs.push(reply.users[i]);
    }
    callback();
  });
}

function IsBlockedID(id) {
  console.log('checking if userid is blocked: ' + id);
  for (let i = 0; i < blockedIDs.length; i += 1) {
    if (blockedIDs[i].id_str == id) {
      return true;
    }
  }
  return false;
}

function GetLastID() {
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

function GetTweets(callback) {
  console.log('Getting Tweets');
  twitterAPI.SearchTwitter(GetLastID(), (Tweets) => {
    TweetsData = Tweets;
    callback();
  });
}

function GetRandomTweet() {
  console.log('getting RandomTweet');
  const tcount = TweetsData.length;
  if (tcount > 0) {
    const r = Math.floor(Math.random() * tcount);
    const RandomTweet = TweetsData[r];
    if (RandomTweet != null) {
      return RandomTweet;
    }
  }
  return null;
}

function IsSpammyUser(screenName, callback) {
  spamScore.GetScore(screenName, (err, score) => {
    if (err) {
      console.log(err);
      callback(null);
    }
    const spammy = score >= spamThreshold;
    callback(spammy);
  });
}

async function Retweet() {
  const randomTweet = await GetRandomTweet();
  if (randomTweet === null) {
    return;
  }
  const isBlocked = await IsBlockedID(randomTweet.user.id_str);
  if (isBlocked) {
    Retweet();
    return;
  }
  IsSpammyUser(randomTweet.user.screen_name, (reply) => {
    console.log(reply);
    if (reply) {
      Retweet();
    } else {
      twitterAPI.PostRetweet(randomTweet.id_str, () => {
        process.exit();
      });
    }
  });
}

function mainLoop() {
  classify.load(() => {
    GetTweets(() => {
      GetBlockedIDs(() => {
        Retweet();
      });
    });
  });
}

mainLoop();
