const jsonfile = require('jsonfile');

const file = 'testdata.json';

function load(callback) {
  jsonfile.readFile(file, callback);
}

function save(newData) {
  load((err, data) => {
    if (err) {
      console.log(err);
    }
    const obj = [];
    if (data) {
      for (let i = 0; i < data.length; i += 1) {
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
