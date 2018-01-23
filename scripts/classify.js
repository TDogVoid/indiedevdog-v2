/* eslint no-unused-vars: ["error", { "args": "none" }] */
const natural = require('natural');
const testData = require('./testData.js');
const readline = require('readline');
const fs = require('fs');

let classifier;

const ClassSpam = 'Spam';
const ClassHam = 'Ham';

function classify(str) {
  return classifier.classify(str);
}

function train(str, type) {
  classifier.addDocument(str, type);
}

function SaveClassifierFile() {
  classifier.save('./classifier.json', (err, c) => {
    // the classifier is saved to the classifier.json file!
    if (err) {
      console.log(err);
      return;
    }
    console.log('Saved classifier');
  });
}

function save() {
  classifier.train();
  SaveClassifierFile();
}

function GetAccuracy(callback) {
  testData.load((err, data) => {
    let right = 0;
    if (err) {
      callback(err, null);
      return;
    }
    for (let i = 0; i < data.length; i += 1) {
      if (data[i].type === classify(data[i].text)) {
        right += 1;
      }
    }
    callback(err, right / data.length);
  });
}

function isTestData() {
  // take about a third of the data to test data
  const i = Math.floor(Math.random() * 3);
  if (i === 1) {
    return true;
  }
  return false;
}

function markSpam(str) {
  if (isTestData()) {
    const obj = { text: str, type: ClassSpam };
    testData.save(obj);
    return;
  }
  train(str, ClassSpam);
  save();
}

function markHam(str) {
  if (isTestData()) {
    const obj = { text: str, type: ClassHam };
    testData.save(obj);
    return;
  }
  train(str, ClassHam);
  save();
}

function initialTraining() {
  console.log('Initial Training');

  const pattSpam = /^spam\b/;
  const pattHam = /^ham\b/;
  const subst = '';

  const rl = readline.createInterface({
    terminal: false,
    input: fs.createReadStream('./SMSSpamCollection.txt'),
  });

  rl.on('line', (line) => {
    let cl = '';
    let str = '';

    if (pattSpam.test(line)) {
      str = line.replace(pattSpam, subst);
      cl = ClassSpam;
    } else if (pattHam.test(line)) {
      str = line.replace(pattHam, subst);
      cl = ClassHam;
    }
    train(str, cl);
  });
  rl.on('close', () => {
    console.log('InitTraining Done');
    save();
  });
}

function load(callback) {
  natural.BayesClassifier.load('classifier.json', null, (err, c) => {
    if (err && err.code === 'ENOENT') {
      classifier = new natural.BayesClassifier();
      initialTraining();
      callback();
      return;
    }
    classifier = c;
    callback();
  });
}

module.exports.load = load;
module.exports.save = save;
module.exports.train = train;
module.exports.classify = classify;
module.exports.markHam = markHam;
module.exports.markSpam = markSpam;
module.exports.GetAccuracy = GetAccuracy;
