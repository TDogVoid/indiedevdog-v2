const natural = require("natural");
var classifier;
const testData = require("./testData.js");

const ClassSpam = "Spam";
const ClassHam = "Ham";

function GetAccuracy(callback) {
  testData.load(function(err, data) {
    let right = 0;
    if (err) {
      callback(err, null);
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const text = data[i].text;
      const type = data[i].type;
      const c = classify(text);
      if (type == c) {
        right++;
      }
    }
    score = right / data.length;
    callback(err, score);
  });
}

function isTestData() {
  //take about a third of the data to test data
  let i = Math.floor(Math.random() * 3);
  console.log(i);
  if (i == 1) {
    return true;
  }
  return false;
}

function markSpam(str) {
  if (isTestData()) {
    let obj = { text: str, type: ClassSpam };
    testData.save(obj);
    return;
  }
  train(str, ClassSpam);
  save();
}

function markHam(str) {
  if (isTestData()) {
    let obj = { text: str, type: ClassHam };
    testData.save(obj);
    return;
  }
  train(str, ClassHam);
  save();
}

function train(str, type) {
  classifier.addDocument(str, type);
}

function initialTraining() {
  console.log("Initial Training");
  const readline = require("readline");
  const fs = require("fs");

  let pattSpam = /^spam\b/;
  let pattHam = /^ham\b/;
  let subst = "";

  const rl = readline.createInterface({
    terminal: false,
    input: fs.createReadStream("./SMSSpamCollection.txt")
  });

  rl.on("line", function(line) {
    let cl = "";

    if (pattSpam.test(line)) {
      str = line.replace(pattSpam, subst);
      cl = ClassSpam;
    } else if (pattHam.test(line)) {
      str = line.replace(pattHam, subst);
      cl = ClassHam;
    }
    train(str, cl);
  });
  rl.on("close", function() {
    console.log("InitTraining Done");
    save();
  });
}

function load() {
  natural.BayesClassifier.load("classifier.json", null, function(err, c) {
    if (err && err.code === "ENOENT") {
      classifier = new natural.BayesClassifier();
      initialTraining();
      return;
    }
    classifier = c;
  });
}

function save() {
  classifier.train();
  SaveClassifierFile();
}

function SaveClassifierFile() {
  classifier.save("./classifier.json", function(err, c) {
    // the classifier is saved to the classifier.json file!
    if (err) {
      console.log(err);
      return;
    }
    console.log("Saved classifier");
  });
}

function classify(str) {
  return classifier.classify(str);
}

module.exports.load = load;
module.exports.save = save;
module.exports.train = train;
module.exports.classify = classify;
module.exports.markHam = markHam;
module.exports.markSpam = markSpam;
module.exports.GetAccuracy = GetAccuracy;
