const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.config = {
    services: ['electron'],
    specs: [
        './tests/*.js'
    ],
    capabilities: [{
      browserName: 'electron',
      'wdio:electronServiceOptions': {
        appBinaryPath: './node_modules/.bin/electron',
        appArgs: ['app=./main.js'],
      }
    }],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        timeout: 60000,
    },
    before: function (capabilities, specs) {
        process.env.NODE_ENV = 'test'; 
        fs.rmSync(path.resolve('./tests/tmp/'), { recursive: true, force: true }); 
        fs.mkdirSync(path.resolve('./tests/tmp/'), { recursive: true, force: true }); 
    },
    onComplete: function () {
        try {
            if (process.platform === 'win32') {
                execSync('taskkill /IM electron.exe /F'); // Windows
            } else if (process.platform === 'darwin' || process.platform === 'linux') {
                execSync("ps aux | grep Electron.app | grep -v grep | awk '{print $2}' | xargs kill -9"); // macOS/Linux
            }
        } catch (error) {
            console.error(error);
        }
    }
}