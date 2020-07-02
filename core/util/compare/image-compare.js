'use strict';

// Compare images using backstop's internal comparison stuff
// modified from core/util/compare/index.js

var cp = require('child_process');
var logger = require('./../logger')('compare');

function compareImages (referencePath, testPath, pair, resembleOutputSettings) {
  return new Promise(function (resolve, reject) {
    var worker = cp.fork(require.resolve('./compare'));
    worker.send({
      referencePath: referencePath,
      testPath: testPath,
      resembleOutputSettings: resembleOutputSettings,
      pair: pair
    });

    worker.on('message', function (data) {
      worker.kill();
      pair.diff = data.diff;

      if (data.status === 'fail') {
        pair.diffImage = data.diffImage;
        logger.error('ERROR { requireSameDimensions: ' + (data.requireSameDimensions ? 'true' : 'false') + ', size: ' + (data.isSameDimensions ? 'ok' : 'isDifferent') + ', content: ' + data.diff.misMatchPercentage + '%, threshold: ' + pair.misMatchThreshold + '% }: ' + pair.label + ' ' + pair.fileName);
      } else {
        logger.success('OK: ' + pair.label + ' ' + pair.fileName);
      }

      resolve(data);
    });
  });
}

// get things from command line and run this stuff
var scriptArgs = process.argv.slice(2);
var referencePath = scriptArgs[0];
var testPath = scriptArgs[1];

// I think this is all that is used here?
var pair = {
  misMatchThreshold: 0.1,
  requireSameDimensions: true
};

// this only seems to be used for ignoreAntialiasing, which is not set by default
var resembleOutputSettings = {};

compareImages(referencePath, testPath, pair, resembleOutputSettings);
