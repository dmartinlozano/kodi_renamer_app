const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const { TvShow, State } = require('./dto/file.js');
const FileProcesser = require('./processer/fileProcesser.js');
const { searchMovie, searchTvShow, languages } = require('./processer/tmdbClient.js');
const { isFolder, extractNameWithoutExtension, extractExtension } = require('./processer/utils.js');

let win;
var films = [];
var tvShow;
global.settings = {};

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
  //win.webContents.openDevTools();
  global.win = win;

  Menu.setApplicationMenu(Menu.buildFromTemplate(
    [
      {
        label: 'Settings',
        submenu: [
          { label: 'Settings', click: async () => win.webContents.send('openSettingsModal')},
          { label: 'Donate', click: async () => shell.openExternal('https://buymeacoffee.com/kodi_renamer')},
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
  let anyFileHasBeenRenamed = false;
  for (let i = 0; i < films.length; i++) {
    if (films[i].state !== State.COMPLETED && films[i].nameToRename != null && films[i].nameToRename != undefined){
      try{
        FileProcesser.renameFilm(films[i]);
        films[i].state = State.COMPLETED;
        anyFileHasBeenRenamed = true;
      }catch(e){
        win.webContents.send('errorNotification:show', e.message);
        continue;
      }
    }
  }
  win.webContents.send('films:updated', films);
  if (anyFileHasBeenRenamed){
    win.webContents.send('okNotification:show', 'The files has been renamed');
  }else{
    win.webContents.send('okNotification:show', 'No files have been renamed');
  }
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
  for (const episode of tvShow.episodes){
    const inputData = episodesInput.find((input)=>episode.path === input.path);
    if (inputData) {
      const season = inputData.season || episode.season;
      const episodeNum = inputData.episode || episode.episode;
      if (!isNaN(season) && !isNaN(episodeNum)){
        const formattedSeason = season.toString().padStart(2, '0');
        const formattedEpisode = episodeNum.toString().padStart(2, '0');
        const match = episode.path.match(new RegExp(episode.patternFound));
        if (match) {
          episode.pathToRename = episode.path.replace(
            match[0],
            `S${formattedSeason}E${formattedEpisode}`
          );
        }else{
          const nameWithoutExtension = extractNameWithoutExtension(episode.path);
          const extension = extractExtension(episode.path);
          episode.pathToRename = `${nameWithoutExtension}.S${formattedSeason}E${formattedEpisode}.${extension}`;
        }
      }
    }
  };
  try{
    FileProcesser.renameEpisodes(tvShow.episodes);
    tvShow.state = State.COMPLETED;
    win.webContents.send('tvShow:updated', tvShow);
    win.webContents.send('okNotification:show', 'The files has been renamed');
  }catch(e){
    win.webContents.send('errorNotification:show', e.message);
  }
});

ipcMain.on('tvShow:delete', async(event, index)=>{
  tvShow.episodes.splice(index, 1);
  win.webContents.send('tvShow:updated', tvShow);
});