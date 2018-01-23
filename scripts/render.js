/* global $ document */
/* eslint no-undef: "error" */

const twitterAPI = require('./scripts/twitterAPI'); // eslint-disable-line import/no-unresolved
const classify = require('./scripts/classify.js'); // eslint-disable-line import/no-unresolved
const spamScore = require('./scripts/spamScore.js'); // eslint-disable-line import/no-unresolved
const TweetsFile = require('./scripts/tweets.js'); // eslint-disable-line import/no-unresolved

let TweetsData = [];

function RemoveFromArray(arr, item) {
  const i = arr.indexOf(item);
  if (i !== -1) {
    arr.splice(i, 1);
  }
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
    }
    const precScore = precisionRound(score, 2) * 100;
    document.getElementById(
      'Accuracy'
    ).innerHTML = `Accuracy Score: ${precScore}%`;
  });
}

function SaveTweets(Tweets) {
  for (let i = 0; i < Tweets.length; i += 1) {
    TweetsData.push(Tweets[i]);
  }
  TweetsFile.save(TweetsData);
}

function MarkSpam(tweet) {
  RemoveFromArray(TweetsData, tweet);
  classify.markSpam(tweet.full_text);
  reclassify(); // eslint-disable-line no-use-before-define
  TweetsFile.save(TweetsData);
}

function MarkHam(tweet) {
  RemoveFromArray(TweetsData, tweet);
  classify.markHam(tweet.full_text);
  reclassify(); // eslint-disable-line no-use-before-define
  TweetsFile.save(TweetsData);
}

function CreateProfileDiv(tweet) {
  const divProfileImage = document.createElement('div');
  divProfileImage.className = 'ProfileImage';

  divProfileImage.innerHTML = `<a target="_blank" href="https://twitter.com/${
    tweet.user.screen_name
  }"><img src="${tweet.user.profile_image_url}"/></a><h1>${
    tweet.user.name
  }</h1>`;

  return divProfileImage;
}

function CreateDivButtons(tweet, divSpamScore) {
  const divButtons = document.createElement('div');
  divButtons.className = 'buttons';

  // buttons
  const SpamButton = document.createElement('button');
  const HamButton = document.createElement('button');
  const ScoreButton = document.createElement('button');
  divButtons.appendChild(SpamButton);
  divButtons.appendChild(HamButton);
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
    spamScore.GetScore(tweet.user.id, (err, Score) => {
      let SpamScoreText = '<h3>SpamScore: </h3>';
      if (err) {
        SpamScoreText += 'Error';
      } else {
        SpamScoreText += Score;
      }
      tweet.user.spamScore = Score; // eslint-disable-line no-param-reassign
      divSpamScore.innerHTML = SpamScoreText; // eslint-disable-line no-param-reassign
    });
  });

  return divButtons;
}

function renderTweet(tweet) {
  const text = tweet.full_text;
  // create divs
  const div = document.createElement('div');
  const divTweetText = document.createElement('div');

  const divSpamScore = document.createElement('div');

  // classNames
  div.className = `tweet ${classify.classify(text)}`;
  divTweetText.className = 'Tweet-text';

  // append
  div.appendChild(CreateProfileDiv(tweet));
  div.appendChild(divSpamScore);
  div.appendChild(divTweetText);
  div.appendChild(CreateDivButtons(tweet, divSpamScore));

  // set data;
  const t = document.createTextNode(text);
  divTweetText.appendChild(t);

  // set spam Score
  if (tweet.user.spamScore !== undefined) {
    let SpamScoreText = '<h3>SpamScore: </h3>';
    SpamScoreText += tweet.user.spamScore;
    divSpamScore.innerHTML = SpamScoreText;
  }

  document.getElementById('tweets').appendChild(div);
}

function reclassify() {
  document.getElementById('tweets').innerHTML = '';
  TweetsData.forEach((tweet) => {
    renderTweet(tweet);
  });
}

function RenderTweets() {
  for (let i = 0; i < TweetsData.length; i += 1) {
    renderTweet(TweetsData[i]);
  }
}

function Load() {
  classify.load(() => {
    TweetsFile.load((err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      TweetsData = data;
      RenderTweets();
    });
  });
}

// eslint-disable-next-line no-unused-vars
function GetTweets() {
  // TODO: GET LastID
  twitterAPI.SearchTwitter(null, (Tweets) => {
    SaveTweets(Tweets);
    RenderTweets();
  });
}

$(document).ready(() => {
  Load();
});
