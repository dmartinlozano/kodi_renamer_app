const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { TvShow } = require('./dto/file.js');
const FileProcesser = require('./processer/fileProcesser.js');
const { searchMovie, searchTvShow, languages } = require('./processer/tmdbClient.js');
const { isFolder, extractNameWithoutExtension, extractExtension } = require('./processer/utils.js');

let win;
var films = [];
var tvShow;
global.settings = {};

const BASE_URL = 'https://api.themoviedb.org/3/';

app.whenReady().then(()=>{
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });
  win.loadFile('index.html');
  win.webContents.on('did-finish-load', () => win.webContents.send('ready'));
  win.webContents.openDevTools();

  Menu.setApplicationMenu(Menu.buildFromTemplate(
    [
      {
        label: 'Settings',
        submenu: [
          { label: 'Settings', click: async () => win.webContents.send('openSettingsModal')
          },
          { type: 'separator' },
          { label: 'Exit', role: 'quit' },
        ]
      }
    ]
  ));
});

app.on('window-all-closed', () =>  (process.platform !== 'darwin') ? app.quit() : null);

ipcMain.on('languages', async(event)=>{
  const langs = await languages();
  win.webContents.send('languages', langs);
});

ipcMain.on('settings:get', async(event, newSettings)=>{
  global.settings = newSettings;
});

ipcMain.on('film:add', async (event, newFilms) => {
  films = films.concat(Array.from(newFilms));
  films = await FileProcesser.checkFilmsInitialState(films);
  win.webContents.send('films:updated', films);
});

ipcMain.on('film:find', async(event, title, year, page)=>{
  const response = await searchMovie(title, year, page);
  win.webContents.send('media:response', response);
});

ipcMain.on('film:found', async(event, title, year, id, moviePosition)=>{
  const extension = extractExtension(films[moviePosition].path);
  films[moviePosition].id = id;
  films[moviePosition].nameToRename=`${title} (${year}) {tmdb-${id}}.${extension}`;
  win.webContents.send('films:updated', films);
});

ipcMain.on('tvShow:find', async(event, title, year, page)=>{
  const response = await searchTvShow(title, year, page);
  win.webContents.send('media:response', response);
});

ipcMain.on('tvShow:found', async(event, title, year)=>{
  tvShow.nameToRename=`${title} (${year})`;
  tvShow = await FileProcesser.getEpisodes(tvShow, tvShow.path);
  win.webContents.send('tvShow:updated', tvShow);
});

ipcMain.on('films:rename', (event)=>{
  var errors = [];
  for (let i = 0; i < films.length; i++) {
    if (films[i].state !== State.COMPLETED){
      try{
        FileProcesser.renameFilm(films[i]);
        films[i].state = State.COMPLETED;
      }catch(e){
        console.error(e);
        errors.push(e);
        continue;
      }
    }
  }
  win.webContents.send('films:updated', films);
  if (errors.length > 0) win.webContents.send('renameAllErrors', errors);
});

ipcMain.on('film:delete', async(event, id)=>{
  let indexFound = films.findIndex((film) => film.id === id);
  if (indexFound !== -1){
    films.splice(indexFound, 1);
    win.webContents.send('films:updated', films);
  }
});

ipcMain.on('tvShow:isFolder', async(event, folderPath)=>{
  const isDirectory = isFolder(folderPath);
  if (isDirectory){
    tvShow = new TvShow(folderPath);
    tvShow = await FileProcesser.checkTvShowInitialState(tvShow);
    if (tvShow.nameToRename) tvShow = await FileProcesser.getEpisodes(tvShow, tvShow.path);
    win.webContents.send('tvShow:updated', tvShow);
  }
});

ipcMain.on('tvShow:rename', (event, episodesInput)=>{
  var errors = [];
  const groupedInputs = episodesInput.reduce((acc, input) => {
    if (!acc[input.index]) acc[input.index] = {};
    acc[input.index][input.type] = input.value; // Store 'season' or 'episode' with the value
    return acc;
}, {});
tvShow.episodes.forEach((episode, index) => {
  const inputData = groupedInputs[index];
  if (inputData) {
    const season = inputData.season || episode.season;
    const episodeNum = inputData.episode || episode.episode;
    const formattedSeason = season.toString().padStart(2, '0');
    const formattedEpisode = episodeNum.toString().padStart(2, '0');
    const match = episode.path.match(new RegExp(episode.patternFound));
    if (match) {
      episode.pathToRename = episode.path.replace(
        match[0],
        `S${formattedSeason}E${formattedEpisode}`
      );
      console.log(episode.pathToRename);
    }else{
      const nameWithoutExtension = extractNameWithoutExtension(episode.path);
      const extension = extractExtension(episode.path);
      episode.pathToRename = `${nameWithoutExtension}.S${formattedSeason}E${formattedEpisode}.${extension}`;
    }
  }
});
FileProcesser.renameEpisodes(tvShow.episodes);
win.webContents.send('tvShow:updated', tvShow);
  if (errors.length > 0) win.webContents.send('renameAllErrors', errors);
});