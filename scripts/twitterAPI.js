const Twit = require('twit');
const UserData = require('./userData');

let TwitClient;
UserData.load(() => {
  TwitClient = new Twit(UserData.GetTwitterConfig());
});

const searchQuery = '@indiedev OR #gamedev -RT';

function GetBlockedIDs(callback) {
  TwitClient.get(
    'blocks/list',
    {
      include_entities: true,
      skip_status: true,
    },
    callback
  );
}

function SearchTwitter(lastID, callback) {
  const Tweets = [];
  TwitClient.get(
    'search/tweets',
    {
      q: searchQuery,
      count: 100,
      lang: 'en',
      result_type: 'recent',
      show_all_inline_media: 'true',
      since_id: lastID,
      tweet_mode: 'extended',
    },
    // eslint-disable-next-line no-unused-vars
    (err, data, response) => {
      if (err) {
        console.log(err);
        return;
      }
      const tweets = data.statuses;
      for (let i = 0; i < tweets.length; i += 1) {
        Tweets.push(tweets[i]);
      }
      callback(Tweets);
    }
  );
}

function GetUserTweets(screenName, callback) {
  const Tweets = [];
  TwitClient.get(
    'statuses/user_timeline',
    {
      screen_name: screenName,
      count: 100,
      include_rts: false,
      exclude_replies: true,
      tweet_mode: 'extended',
    },
    // eslint-disable-next-line no-unused-vars
    (err, data, response) => {
      if (err) {
        callback(err, null);
      }
      const tweets = data;
      for (let i = 0; i < tweets.length; i += 1) {
        Tweets.push(tweets[i]);
      }
      callback(err, Tweets);
    }
  );
}

function PostRetweet(id_str) {
  console.log('posting: ' + id_str);
  TwitClient.post(
    'statuses/retweet/:id',
    {
      id: id_str,
    },
    (err, data, response) => {
      if (err) {
        console.log(err);
      }
    }
  );
}

module.exports.SearchTwitter = SearchTwitter;
module.exports.GetUserTweets = GetUserTweets;
module.exports.GetBlockedIDs = GetBlockedIDs;
module.exports.PostRetweet = PostRetweet;
