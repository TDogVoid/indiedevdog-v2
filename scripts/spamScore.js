// This doesn't use the classifier but a list of words in tweets. Just to help filter more,
// due to rate limits. I am only getting this data when the button is clicked or when the
// cron job has picked a potential tweet.
// The idea of this is inspired from https://github.com/Sentdex/reddit_spam_detector_bot

const twitterAPI = require('./twitterAPI.js');

const spamWords = [
  'udemy',
  'course',
  'save',
  'coupon',
  'free',
  'discount',
  'courses',
  'learn',
];

function matchWords(subject, words) {
  // snippet from https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9781449327453/ch05s02.html
  // leaving it the return list of words match incase I want to do something with it in the future
  const regexMetachars = /[(){[*+?.\\^$|]/gi;

  for (let i = 0; i < words.length; i += 1) {
    words[i] = words[i].replace(regexMetachars, '\\$&'); // eslint-disable-line no-param-reassign
  }

  const regex = new RegExp('\\b(?:' + words.join('|') + ')\\b', 'gi'); // eslint-disable-line prefer-template

  return subject.match(regex) || [];
}

function IsSpamWordInText(text) {
  const match = matchWords(text, spamWords);
  if (match.length > 0) {
    return true;
  }
  return false;
}

function precisionRound(number, precision) {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

function GetScore(screenName, callback) {
  let spamCount = 0;
  twitterAPI.GetUserTweets(screenName, (err, tweets) => {
    if (err) {
      callback(err, null);
      return;
    }
    for (let i = 0; i < tweets.length; i += 1) {
      const text = tweets[i].full_text;
      if (IsSpamWordInText(text)) {
        spamCount += 1;
      }
    }
    const score = precisionRound(spamCount / tweets.length, 2);
    callback(err, score);
  });
}

module.exports.GetScore = GetScore;
