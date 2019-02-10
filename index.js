'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors');
const fileUpload = require('express-fileupload');
const readline = require('readline');
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());

let dir = './public/files'
let filesAndFolders = [];
let filesAndFoldersOBJ = {};

// static files
app.use(express.static('./public'));

app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: './public' });
})

app.listen(PORT, () => {
  console.log('Listening on port:', PORT, 'use CTRL+C to close.')
})

// Admin console commands
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  if (input === 'print list') {
    console.log(filesAndFoldersOBJ);
  } else if (input === 'scan folder') {
    scanFolder()
  } else {
    console.log(input, 'is not a valid input')
  };
});


// Process files and folders.
var walk = function (dir, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function (file) {
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

function scanFolder() {
  walk(dir, function (err, results) {
    if (err) throw err;
    let processed = [];

    for (let i = 0; i < results.length; i++) {
      let splitting = results[i].split('/');
      let processing = [];
      for (let j = 0; j < splitting.length; j++) {
        if (j < splitting.indexOf('music') + 1) {
          delete splitting[j];
        } else {
          processing.push(splitting[j]);
        };
      }
      processed.push(processing.join('+'));
    }
    filesAndFolders = processed
    saveToJSON(filesAndFolders);
  });
}

function saveToJSON(fileList) {
  let toObject = [];
  for (let i = 0; i < fileList.length; i++) {
    let folderFileSplit = fileList[i].split('+');
    let fileName = folderFileSplit[folderFileSplit.length - 1];
    folderFileSplit.pop();
    let folderPath = folderFileSplit.join('/');

    let file = {
      filename: fileName,
      folderpath: folderPath,
    }
    toObject.push(file);
  }

  filesAndFoldersOBJ = JSON.stringify(toObject)
  fs.writeFile("./public/master-list.json", JSON.stringify(toObject), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
}

scanFolder();