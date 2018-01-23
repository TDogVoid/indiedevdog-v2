const jsonfile = require('jsonfile');

const file = 'tweets.json';

function load(callback) {
  jsonfile.readFile(file, callback);
}

function save(obj) {
  jsonfile.writeFile(file, obj);
}

module.exports.save = save;
module.exports.load = load;
