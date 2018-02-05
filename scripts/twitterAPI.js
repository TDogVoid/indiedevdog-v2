const Twit = require('twit');
const UserData = require('./userData');

const searchQuery = '@indiedev OR #gamedev -RT -#mPLUSRewards -Hack';

async function GetBlockedIDs(callback) {
  let TwitClient = await new Twit(UserData.GetTwitterConfig());
  TwitClient.get(
    'blocks/list',
    {
      include_entities: true,
      skip_status: true,
    },
    callback
  );
}

async function SearchTwitter(lastID, callback) {
  const Tweets = [];
  let TwitClient = await new Twit(UserData.GetTwitterConfig());
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

async function GetUserTweets(screenName, callback) {
  const Tweets = [];
  let TwitClient = await new Twit(UserData.GetTwitterConfig());
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

async function PostRetweet(id_str, callback) {
  console.log('posting: ' + id_str);
  let TwitClient = await new Twit(UserData.GetTwitterConfig());
  TwitClient.post(
    'statuses/retweet/:id',
    {
      id: id_str,
    },
    (err, data, response) => {
      if (err) {
        console.log(err);
      }
      callback();
    }
  );
}

module.exports.SearchTwitter = SearchTwitter;
module.exports.GetUserTweets = GetUserTweets;
module.exports.GetBlockedIDs = GetBlockedIDs;
module.exports.PostRetweet = PostRetweet;
