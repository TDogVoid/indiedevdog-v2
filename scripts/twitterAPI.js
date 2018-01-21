const T = require("../twitterConfig.js");

let searchQuery = "@indiedev OR #gamedev -RT";
let BlockedIDs = [];

SearchTwitter = function(lastID, callback) {
  let Tweets = [];
  T.TwitClient.get(
    "search/tweets",
    {
      q: searchQuery,
      count: 100,
      lang: "en",
      result_type: "recent",
      show_all_inline_media: "true",
      since_id: lastID,
      tweet_mode: "extended"
    },
    function(err, data, response) {
      if (err) {
        console.log(err);
        return;
      }
      let _tweets = data.statuses;
      for (let i = 0; i < _tweets.length; i++) {
        Tweets.push(_tweets[i]);
      }
      callback(Tweets);
    }
  );
};

function GetUserTweets(id, callback) {
  let Tweets = [];
  T.TwitClient.get(
    "statuses/user_timeline",
    {
      user_id: id,
      count: 100,
      include_rts: false,
      exclude_replies: true,
      tweet_mode: "extended"
    },
    function(err, data, response) {
      if (err) {
        callback(err, null);
      }
      let _tweets = data;
      for (let i = 0; i < _tweets.length; i++) {
        Tweets.push(_tweets[i]);
      }
      callback(err, Tweets);
    }
  );
}

module.exports.SearchTwitter = SearchTwitter;
module.exports.GetUserTweets = GetUserTweets;
