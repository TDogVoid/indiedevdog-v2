/* global $ document */
/* eslint no-undef: "error" */

const twitterAPI = require('./scripts/twitterAPI'); // eslint-disable-line import/no-unresolved
const classify = require('./scripts/classify.js'); // eslint-disable-line import/no-unresolved
const spamScore = require('./scripts/spamScore.js'); // eslint-disable-line import/no-unresolved
const TweetsFile = require('./scripts/tweets.js'); // eslint-disable-line import/no-unresolved
const UserData = require('./scripts/userData.js'); // eslint-disable-line import/no-unresolved

let TweetsData = [];

function removeFromArray(arr, item) {
  const i = arr.indexOf(item);
  if (i !== -1) {
    arr.splice(i, 1);
  }
}

function getLastID() {
  // TODO: need to save lastid to a pref file so when tweets is empty it still gets only new ones
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

function precisionRound(number, precision) {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

// eslint-disable-next-line no-unused-vars
function GetAccuracy() {
  classify.GetAccuracy((err, score) => {
    if (err) {
      console.log(err);
      return;
    }
    const precScore = precisionRound(score, 2) * 100;
    document.getElementById(
      'Accuracy'
    ).innerHTML = `Accuracy Score: ${precScore}%`;
  });
}

function saveTweets(Tweets) {
  for (let i = 0; i < Tweets.length; i += 1) {
    TweetsData.push(Tweets[i]);
  }

  TweetsFile.save(TweetsData);
}

function MarkSpam(tweet) {
  removeFromArray(TweetsData, tweet);
  classify.markSpam(tweet.full_text);
  reclassify(); // eslint-disable-line no-use-before-define
  TweetsFile.save(TweetsData);
}

function MarkHam(tweet) {
  removeFromArray(TweetsData, tweet);
  classify.markHam(tweet.full_text);
  reclassify(); // eslint-disable-line no-use-before-define
  TweetsFile.save(TweetsData);
}

function createProfileDiv(tweet) {
  const divProfileImage = document.createElement('div');
  divProfileImage.className = 'ProfileImage';

  divProfileImage.innerHTML = `<a target="_blank" href="https://twitter.com/${
    tweet.user.screen_name
  }"><img src="${tweet.user.profile_image_url}"/></a><h1>${
    tweet.user.name
  }</h1>`;

  return divProfileImage;
}

function createDivButtons(tweet, divSpamScore) {
  const divButtons = document.createElement('div');
  divButtons.className = 'buttons';

  // buttons
  const SpamButton = document.createElement('button');
  const HamButton = document.createElement('button');
  const ScoreButton = document.createElement('button');
  divButtons.appendChild(HamButton);
  divButtons.appendChild(SpamButton);
  divButtons.appendChild(ScoreButton);
  ScoreButton.innerText = 'Get Spam Score';
  SpamButton.innerText = 'Mark Spam';
  HamButton.innerText = 'Mark Ham';
  SpamButton.className = 'Spam';
  HamButton.className = 'Ham';

  SpamButton.addEventListener('click', () => {
    MarkSpam(tweet);
  });

  HamButton.addEventListener('click', () => {
    MarkHam(tweet);
  });

  ScoreButton.addEventListener('click', () => {
    spamScore.GetScore(tweet.user.screen_name, (err, Score) => {
      let SpamScoreText = '<h3>SpamScore: </h3>';
      if (err) {
        SpamScoreText += 'Error';
        console.log(err);
      } else {
        SpamScoreText += Score;
      }
      tweet.user.spamScore = Score; // eslint-disable-line no-param-reassign
      divSpamScore.innerHTML = SpamScoreText; // eslint-disable-line no-param-reassign
    });
  });

  return divButtons;
}

function createMediaImage(tweet) {
  const divMedia = document.createElement('div');
  const entities = tweet.extended_entities;
  if (!entities) {
    return divMedia;
  }
  if (entities.media[0].type === 'photo') {
    divMedia.innerHTML = `<a target="_blank" href="${
      entities.media[0].media_url_https
    }"><img src="${entities.media[0].media_url_https}" alt="${
      tweet.user.screen_name
    } Image" ></a>`;
  } else if (
    entities.media[0].type === 'animated_gif' ||
    entities.media[0].type === 'video'
  ) {
    divMedia.innerHTML = `<video width="320" height="240" controls>
    <source src="${entities.media[0].video_info.variants[0].url}" type="${
      entities.media[0].video_info.variants[0].content_type
    }">
  Your browser does not support the video tag.
  </video>`;
  }

  return divMedia;
}

function createTweetText(text) {
  const divTweetText = document.createElement('div');
  divTweetText.className = 'Tweet-text';
  const t = document.createTextNode(text);
  divTweetText.appendChild(t);
  return divTweetText;
}

function setSpamScore(divSpamScore, tweet) {
  if (tweet.user.spamScore !== undefined) {
    let SpamScoreText = '<h3>SpamScore: </h3>';
    SpamScoreText += tweet.user.spamScore;
    divSpamScore.innerHTML = SpamScoreText; // eslint-disable-line no-param-reassign
  }
}

function renderTweet(tweet, DivID) {
  const text = tweet.full_text;

  // create divs
  const div = document.createElement('div');
  const divSpamScore = document.createElement('div');

  // classNames
  div.className = `tweet ${classify.classify(text)}`;

  // append
  div.appendChild(createProfileDiv(tweet));
  div.appendChild(divSpamScore);
  div.appendChild(createTweetText(text));
  div.appendChild(createMediaImage(tweet));
  div.appendChild(createDivButtons(tweet, divSpamScore));

  // set spam Score
  setSpamScore(divSpamScore, tweet);

  document.getElementById(DivID).appendChild(div);
}

function renderTweets() {
  GetAccuracy();
  for (let i = 0; i < TweetsData.length; i += 1) {
    renderTweet(TweetsData[i], 'tweets');
  }
}

function renderTrainingMode() {
  document.getElementById('Training').innerHTML = '';
  renderTweet(TweetsData[0], 'Training');
}

function reclassify() {
  document.getElementById('tweets').innerHTML = '';
  renderTweets();
  renderTrainingMode();
}

function load() {
  classify.load(() => {
    TweetsFile.load((err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      TweetsData = data;
      renderTweets();
      renderTrainingMode();
    });
  });
}

// eslint-disable-next-line no-unused-vars
function GetTweets() {
  twitterAPI.SearchTwitter(getLastID(), (Tweets) => {
    saveTweets(Tweets);
    renderTweets();
    renderTrainingMode();

    // set new LastID
    getLastID();
  });
}

$(document).ready(() => {
  UserData.load(() => {
    load();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.keyCode === 72) {
    MarkHam(TweetsData[0]);
  } else if (event.keyCode === 83) {
    MarkSpam(TweetsData[0]);
  }
});
