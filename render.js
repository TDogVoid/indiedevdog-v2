const twitterAPI = require("./twitterAPI.js");
const classify = require("./classify.js");
const spamScore = require("./spamScore.js");

let TweetsData = [];

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

function GetTweets() {
  //TODO: GET LastID
  classify.load();
  twitterAPI.SearchTwitter(null, Tweets => {
    TweetsData = Tweets;
    for (let i = 0; i < Tweets.length; i++) {
      renderTweet(Tweets[i]);
    }
  });
}

function MarkSpam(tweet) {
  RemoveFromArray(TweetsData, tweet);
  classify.markSpam(tweet.full_text);
  reclassify();
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
}

function renderTweet(tweet) {
  let text = tweet.full_text;
  //create divs
  let div = document.createElement("div");
  let divTweetText = document.createElement("div");
  let divProfileImage = document.createElement("div");
  let divButtons = document.createElement("div");
  let divSpamScore = document.createElement("div");

  //classNames
  c = classify.classify(text);
  div.className = "tweet " + c;
  divTweetText.className = "Tweet-text";
  divProfileImage.className = "ProfileImage";
  divButtons.className = "buttons";

  //append
  div.appendChild(divProfileImage);
  div.appendChild(divSpamScore);
  div.appendChild(divTweetText);
  div.appendChild(divButtons);

  //set data;
  let t = document.createTextNode(text);
  divTweetText.appendChild(t);

  divProfileImage.innerHTML =
    '<a target="_blank" href="https://twitter.com/' +
    tweet.user.screen_name +
    '"><img src=' +
    tweet.user.profile_image_url +
    " /></a>" +
    "<h1>" +
    tweet.user.name +
    "</h1>";

  //set spam Score
  if (tweet.user.spamScore != undefined) {
    let SpamScoreText = "<h3>SpamScore: </h3>";
    SpamScoreText += tweet.user.spamScore;
    divSpamScore.innerHTML = SpamScoreText;
  }

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
        spamScoreText += "Error";
      } else {
        SpamScoreText += Score;
      }
      tweet.user.spamScore = Score;
      divSpamScore.innerHTML = SpamScoreText;
    });
  });

  document.getElementById("tweets").appendChild(div);
}

function reclassify() {
  document.getElementById("tweets").innerHTML = "";
  TweetsData.forEach(tweet => {
    renderTweet(tweet);
  });
}
