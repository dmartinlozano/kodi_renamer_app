import { expect } from 'chai';
import { exec, spawn } from 'child_process';
import pty from 'node-pty';
import stripAnsi from 'strip-ansi';
import fs from 'fs';

describe('CLI Tests', () => {
  let cliCommand;

  before(() => {
    cliCommand = 'kodi_renamer';
    fs.rmSync('./tests/tmp', { recursive: true, force: true });
    fs.mkdirSync('./tests/tmp', { recursive: true, force: true });
    fs.writeFileSync('./tests/tmp/Aterriza como puedas.mp4', '');
    fs.writeFileSync('./tests/tmp/Aterriza como puedas 1.mp4', '');
    fs.writeFileSync('./tests/tmp/Aterriza como puedas 1.srt', '');
    fs.mkdirSync('./tests/tmp/South Park/', { recursive: true, force: true });
    fs.mkdirSync('./tests/tmp/South Park/Temporada1', { recursive: true, force: true });
    fs.mkdirSync('./tests/tmp/South Park/Temporada2', { recursive: true, force: true });
    fs.writeFileSync('./tests/tmp/South Park/Temporada1/South Park 1x03.mkv', '');
    fs.writeFileSync('./tests/tmp/South Park/Temporada2/South Park 2x10.mkv', '');
    fs.writeFileSync('./tests/tmp/South Park/South Park 4x05.mkv', '');
    fs.writeFileSync('./tests/tmp/South Park/South Park 4x05.srt', '');
  });

  it('Should show help if no arguments are passed', (done) => {
    exec(`${cliCommand}`, (err, stdout) => {
      expect(stdout).to.include('Usage:');
      done();
    });
  });

  it('Film not found', (done) => {
    exec(`${cliCommand} -f ./tests/tmp/file.mp4 -l es`, (err, stdout, stderr) => {
      expect(stderr).to.include('Film not found');
      done();
    });
  });

  it('Path is a folder', (done) => {
    exec(`${cliCommand} -f ./tests/tmp -l es`, (err, stdout, stderr) => {
      expect(stderr).to.include('Path is a folder');
      done();
    });
  });

  it('Language is mandatory', (done) => {
    exec(`${cliCommand} -f ./tests/tmp`, (err, stdout, stderr) => {
      expect(stderr).to.include("required option '-l, --language <lang>' not specified");
      done();
    });
  });

  it('The movie was found without a search. Renaming denied.', (done) => {
    const process = spawn(cliCommand, ['-f', './tests/tmp/Aterriza como puedas 1.mp4', '-l', 'es']);
    process.stdout.on('data', (data) => {
      if (data.toString().includes('Do you want rename the film to')) {
        process.stdin.write('n\n');
      }
    });
  
    process.on('close', (code) => {
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas 1.mp4')).to.be.true;
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas (1980) {tmdb-813}.mp4')).to.be.false;
      done();
    });
  });

  it('The movie was found without a search. Renaming accepted.', (done) => {
    const process = spawn(cliCommand, ['-f', './tests/tmp/Aterriza como puedas 1.mp4', '-l', 'es']);
    process.stdout.on('data', (data) => {
      if (data.toString().includes('Do you want rename the film to')) {
        process.stdin.write('y\n');
      }
    });
  
    process.on('close', (code) => {
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas 1.mp4')).to.be.false;
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas 1.srt')).to.be.false;
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas (1980) {tmdb-813}.mp4')).to.be.true;
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas (1980) {tmdb-813}.srt')).to.be.true;
      done();
    });
  });

  it('Should require a title and year, then exit without further messages', (done) => {
    const process = spawn(cliCommand, ['-f', './tests/tmp/Aterriza como puedas.mp4', '-l', 'es']);
    let logOutput = '';
  
    process.stdout.on('data', (data) => {
      logOutput += data.toString();
      if (data.toString().includes('Title to find:')) {
        process.stdin.write('\n');
      }
  
      if (data.toString().includes('The title is mandatory')) {
        process.stdin.write('Aterriza como puedas\n');
      }
  
      if (data.toString().includes('Year (4 digits)')) {
        process.stdin.write('\n');
      }

      if (data.toString().includes('Select a movie')) {
        process.kill();
      }
    });
  
    process.on('close', (code) => {
      let cleanOutput = stripAnsi(logOutput);
      expect(cleanOutput).to.include('The title is mandatory');
      expect(cleanOutput).to.include('Year (4 digits)');
      done();
    });
  });


  it('Find film and rename it', (done) => {
    
    const ptyProcess = pty.spawn(cliCommand, ['-f', './tests/tmp/Aterriza como puedas.mp4', '-l', 'es'], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    });
    let logOutput = '';
  
    ptyProcess.on('data', async (data) => {
      logOutput += data.toString();

      if (data.toString().includes('Title to find:')) {
        ptyProcess.write('Aterriza como puedas\n');
      }

      if (data.toString().includes('Year (4 digits)')) {
        ptyProcess.write('1983\n');
      }

      if (data.toString().includes('Aterriza como puedas 2')) {
        ptyProcess.write('\n');
      }

      if (data.toString().includes('Do you want rename the film to')) {
        ptyProcess.write('yes\n');
      }

      if (data.toString().includes('Film renamed')) {
        process.kill();
      }
    });


    ptyProcess.on('close', (code) => {
      let cleanOutput = stripAnsi(logOutput);
      console.log("cleanOutput:");
      console.log(cleanOutput);
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas.mp4')).to.be.false;
      expect(fs.existsSync('./tests/tmp/Aterriza como puedas 2 (1982) {tmdb-2665}.mp4')).to.be.true;
      done();
    });
  });

});
