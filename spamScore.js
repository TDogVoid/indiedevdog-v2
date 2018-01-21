// This doesn't use the classifier but a list of words in tweets. Just to help filter more, due to rate limits
// I am only getting this data when the button is clicked or when the cron job has picked a potential tweet.
// The idea of this is inspired from https://github.com/Sentdex/reddit_spam_detector_bot

const twitterAPI = require("./twitterAPI.js");
let spamWords = ["udemy", "course", "save", "coupon", "free", "discount"];

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function GetScore(userID, callback) {
  console.log("Getting Spam Score");
  let spamCount = 0;
  twitterAPI.GetUserTweets(userID, function(err, tweets) {
    if (err) {
      callback(err, null);
    }
    for (let i = 0; i < tweets.length; i++) {
      const text = tweets[i].full_text;
      if (IsSpamWordInText(text)) {
        spamCount++;
      }
    }
    let score = precisionRound(spamCount / tweets.length, 2);
    console.log("Score: " + spamCount / tweets.length);
    callback(err, score);
  });
}

function matchWords(subject, words) {
  // snippet from https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9781449327453/ch05s02.html
  // leaving it the return list of words match incase I want to do something with it in the future
  var regexMetachars = /[(){[*+?.\\^$|]/gi;

  for (var i = 0; i < words.length; i++) {
    words[i] = words[i].replace(regexMetachars, "\\$&");
  }

  var regex = new RegExp("\\b(?:" + words.join("|") + ")\\b", "gi");

  return subject.match(regex) || [];
}

function IsSpamWordInText(text) {
  let match = matchWords(text, spamWords);
  if (match.length > 0) {
    return true;
  }
  return false;
}

module.exports.GetScore = GetScore;
