/* global $ document */
/* eslint no-undef: "error" */

const electron = require('electron');

const { ipcRenderer } = electron;

let TweetsData = [];

// eslint-disable-next-line no-unused-vars
function RenderAccuracy(score) {
  document.getElementById(
    'Accuracy'
  ).innerHTML = `<div class="col s5 teal lighten-2">Accuracy Score: ${score}%</div>`;
}

ipcRenderer.on('Classifier:Accuracy', (event, score) => {
  RenderAccuracy(score);
});

function MarkSpam(tweet) {
  ipcRenderer.send('Tweet:MarkSpam', tweet);
}

function MarkHam(tweet) {
  ipcRenderer.send('Tweet:MarkHam', tweet);
}

function createProfileDiv(tweet) {
  const divProfileImage = document.createElement('div');
  divProfileImage.className = 'ProfileImage';

  divProfileImage.innerHTML = `<div class="col s2"><a target="_blank" href="https://twitter.com/${
    tweet.user.screen_name
  }"><img src="${
    tweet.user.profile_image_url
  }" class="circle responsive-img" alt="" /></a></div><div class="col s10"><h4>${
    tweet.user.name
  }</h4></div>`;

  return divProfileImage;
}

function createDivButtons(tweet) {
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
    ipcRenderer.send('User:GetSpamScore', tweet);
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
    divMedia.innerHTML = `<div class="col s12"><a target="_blank" href="${
      entities.media[0].media_url_https
    }"><img class="responsive-img" src="${
      entities.media[0].media_url_https
    }" alt="${tweet.user.screen_name} Missing Image" ></a></div>`;
  } else if (
    entities.media[0].type === 'animated_gif' ||
    entities.media[0].type === 'video'
  ) {
    divMedia.innerHTML = `<div class="col s12"><video class="responsive-video" controls>
    <source src="${entities.media[0].video_info.variants[0].url}" type="${
      entities.media[0].video_info.variants[0].content_type
    }">
  Your browser does not support the video tag.
  </video> </div>`;
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

function renderSpamScore(divSpamScore, tweet) {
  if (tweet.user.spamScore !== undefined) {
    let SpamScoreText = 'SpamScore: ';
    SpamScoreText += tweet.user.spamScore;
    divSpamScore.innerHTML = `<div class="col s12"><h5>${SpamScoreText}</h5></div>`; // eslint-disable-line no-param-reassign
  }
}

function renderTweet(tweet, DivID) {
  const text = tweet.full_text;

  // create divs
  const div = document.createElement('div');
  const divSpamScore = document.createElement('div');

  // classNames
  div.className = `tweet ${tweet.ClassifiedType}`;

  // append
  div.appendChild(createProfileDiv(tweet));
  div.appendChild(divSpamScore);
  div.appendChild(createTweetText(text));
  div.appendChild(createMediaImage(tweet));
  div.appendChild(createDivButtons(tweet, divSpamScore));

  // set spam Score
  renderSpamScore(divSpamScore, tweet);

  document.getElementById(DivID).appendChild(div);
}

function renderTweets() {
  document.getElementById('tweets').innerHTML = '';
  for (let i = 0; i < TweetsData.length; i += 1) {
    renderTweet(TweetsData[i], 'tweets');
  }
}

function renderTrainingMode() {
  document.getElementById('Training').innerHTML = '';
  renderTweet(TweetsData[0], 'Training');
}

// eslint-disable-next-line no-unused-vars
function GetTweets() {
  ipcRenderer.send('Tweets:Get');
}

function ConfigValidation() {
  const consumer_key = document.getElementById('consumer_key').value;
  const consumer_secret = document.getElementById('consumer_secret').value;
  const access_token = document.getElementById('access_token').value;
  const access_token_secret = document.getElementById('access_token_secret')
    .value;
  if (
    consumer_key === '' ||
    consumer_secret === '' ||
    access_token === '' ||
    access_token_secret === ''
  ) {
    alert('missing a config');
    return false;
  }
  return true;
}

function SaveConfig() {
  if (ConfigValidation()) {
    const consumer_key = document.getElementById('consumer_key').value;
    const consumer_secret = document.getElementById('consumer_secret').value;
    const access_token = document.getElementById('access_token').value;
    const access_token_secret = document.getElementById('access_token_secret')
      .value;
    const Keys = {
      consumer_key,
      consumer_secret,
      access_token,
      access_token_secret,
    };
    ipcRenderer.send('Config:TwitterKeys', Keys);
  }
}

document.addEventListener('keydown', (event) => {
  if (event.keyCode === 72) {
    MarkHam(TweetsData[0]);
  } else if (event.keyCode === 83) {
    MarkSpam(TweetsData[0]);
  }
});

ipcRenderer.on('Tweets:Data', (event, Data) => {
  TweetsData = Data;
  renderTrainingMode();
  renderTweets();
});

$(document).ready(() => {
  ipcRenderer.send('Tweets:GetData');
});
