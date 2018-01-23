const jsonfile = require('jsonfile');

const file = 'userData.json';

let UserData = {
  LastID: 0,
};

function load(callback) {
  jsonfile.readFile(file, (err, data) => {
    if (err) {
      console.log(err);
      callback(err, null);
      return;
    }
    UserData = data;

    callback(err, UserData);
  });
}

function save() {
  jsonfile.writeFile(file, UserData);
}

function setLastID(id) {
  // Make sure we don't set a lower id;
  if (id > UserData.LastID) {
    UserData.LastID = id;
    save();
  }
}

function getLastID() {
  return UserData.LastID;
}

module.exports.save = save;
module.exports.load = load;
module.exports.setLastID = setLastID;
module.exports.getLastID = getLastID;
