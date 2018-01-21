const jsonfile = require("jsonfile");
const file = "testdata.json";

function load(callback) {
  jsonfile.readFile(file, callback);
}

function save(newData) {
  load(function(err, data) {
    if (err) {
      console.log(err);
    }
    let obj = [];
    if (data) {
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        obj.push(element);
      }
    }
    obj.push(newData);
    jsonfile.writeFile(file, obj);
  });
}

module.exports.save = save;
module.exports.load = load;
