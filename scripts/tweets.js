const jsonfile = require('jsonfile');

const file = 'tweets.json';
let isLoaded = false;

function load(callback) {
  jsonfile.readFile(file, callback);
  isLoaded = true;
}

function save(obj) {
  if (isLoaded) {
    jsonfile.writeFile(file, obj);
  }
}

module.exports.save = save;
module.exports.load = load;
