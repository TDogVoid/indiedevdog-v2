const twitterAPI = require("./scripts/twitterAPI");
const classify = require("./scripts/classify.js");
const spamScore = require("./scripts/spamScore.js");
const TweetsFile = require("./scripts/tweets.js");

let TweetsData = [];

$(document).ready(function() {
  Load();
});

function GetAccuracy() {
  console.log("Getting Accuracy");
  classify.GetAccuracy(function(err, score) {
    if (err) {
      console.log(err);
    }
    console.log(score);
    document.getElementById("Accuracy").innerHTML =
      "Accuracy Score: " + precisionRound(score, 2) * 100 + "%";
  });
}

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function Load() {
  classify.load();
  TweetsFile.load(function(err, data) {
    if (err) {
      console.log(err);
      return;
    }
    TweetsData = data;
    RenderTweets();
  });
}

function RenderTrainingMode() {}

function RenderTweets() {
  for (let i = 0; i < TweetsData.length; i++) {
    renderTweet(TweetsData[i]);
  }
}

function SaveTweets(Tweets) {
  for (let i = 0; i < Tweets.length; i++) {
    TweetsData.push(Tweets[i]);
  }
  TweetsFile.save(TweetsData);
}

function GetTweets() {
  //TODO: GET LastID
  twitterAPI.SearchTwitter(null, Tweets => {
    SaveTweets(Tweets);
    RenderTweets();
  });
}

function MarkSpam(tweet) {
  RemoveFromArray(TweetsData, tweet);
  classify.markSpam(tweet.full_text);
  reclassify();
  TweetsFile.save(TweetsData);
}

function RemoveFromArray(arr, item) {
  var i = arr.indexOf(item);
  if (i != -1) {
    arr.splice(i, 1);
  }
}

function MarkHam(tweet) {
  RemoveFromArray(TweetsData, tweet);
  classify.markHam(tweet.full_text);
  reclassify();
  TweetsFile.save(TweetsData);
}

function CreateProfileDiv(tweet) {
  let divProfileImage = document.createElement("div");
  divProfileImage.className = "ProfileImage";

  divProfileImage.innerHTML =
    '<a target="_blank" href="https://twitter.com/' +
    tweet.user.screen_name +
    '"><img src=' +
    tweet.user.profile_image_url +
    " /></a>" +
    "<h1>" +
    tweet.user.name +
    "</h1>";

  return divProfileImage;
}

function CreateDivButtons(tweet, divSpamScore) {
  let divButtons = document.createElement("div");
  divButtons.className = "buttons";

  //buttons
  let SpamButton = document.createElement("button");
  let HamButton = document.createElement("button");
  let ScoreButton = document.createElement("button");
  divButtons.appendChild(SpamButton);
  divButtons.appendChild(HamButton);
  divButtons.appendChild(ScoreButton);
  ScoreButton.innerText = "Get Spam Score";
  SpamButton.innerText = "Mark Spam";
  HamButton.innerText = "Mark Ham";
  SpamButton.className = "Spam";
  HamButton.className = "Ham";

  SpamButton.addEventListener("click", function() {
    MarkSpam(tweet);
  });

  HamButton.addEventListener("click", function() {
    MarkHam(tweet);
  });

  ScoreButton.addEventListener("click", function() {
    spamScore.GetScore(tweet.user.id, function(err, Score) {
      let SpamScoreText = "<h3>SpamScore: </h3>";
      if (err) {
        SpamScoreText += "Error";
      } else {
        SpamScoreText += Score;
      }
      tweet.user.spamScore = Score;
      divSpamScore.innerHTML = SpamScoreText;
    });
  });

  return divButtons;
}

function renderTweet(tweet) {
  let text = tweet.full_text;
  //create divs
  let div = document.createElement("div");
  let divTweetText = document.createElement("div");

  let divSpamScore = document.createElement("div");

  //classNames
  c = classify.classify(text);
  div.className = "tweet " + c;
  divTweetText.className = "Tweet-text";

  //append
  div.appendChild(CreateProfileDiv(tweet));
  div.appendChild(divSpamScore);
  div.appendChild(divTweetText);
  div.appendChild(CreateDivButtons(tweet, divSpamScore));

  //set data;
  let t = document.createTextNode(text);
  divTweetText.appendChild(t);

  //set spam Score
  if (tweet.user.spamScore != undefined) {
    let SpamScoreText = "<h3>SpamScore: </h3>";
    SpamScoreText += tweet.user.spamScore;
    divSpamScore.innerHTML = SpamScoreText;
  }

  document.getElementById("tweets").appendChild(div);
}

function reclassify() {
  document.getElementById("tweets").innerHTML = "";
  TweetsData.forEach(tweet => {
    renderTweet(tweet);
  });
}
