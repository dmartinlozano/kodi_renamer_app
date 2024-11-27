const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { KRFile, Type, State } = require('./processer/file.js');
const FileProcesser = require('./processer/fileProcesser.js');
const { searchMovie, languages } = require('./processer/tmdbClient.js');
const { extractExtension } = require('./processer/utils.js');

let win;
var films = [];

const BASE_URL = 'https://api.themoviedb.org/3/';

app.whenReady().then(()=>{
  const locale = app.getLocale();
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: [`--locale=${locale}`]
    },
  });
  win.loadFile('index.html');
  win.webContents.on('did-finish-load', () => win.webContents.send('ready'));
  win.webContents.openDevTools();

  const customMenuTemplate = [{
      label: 'Settings',
      submenu: [
        { label: 'Default Language', click: async () => {
            const langs = await languages();
            win.webContents.send('openLanguageModal', langs);
          }
        },
        { type: 'separator' },
        { label: 'Exit', role: 'quit' },
      ],
    }
  ];
  const customMenu = Menu.buildFromTemplate(customMenuTemplate);
  Menu.setApplicationMenu(customMenu);
});

app.on('window-all-closed', () =>  (process.platform !== 'darwin') ? app.quit() : null);

ipcMain.on('addFilm', async (event, newFilms, lang) => {
  films = films.concat(Array.from(newFilms));
  films = await FileProcesser.checkFilmsInitialState(films, lang);
  win.webContents.send('updatedFilms', films);
});

ipcMain.on('languages', async(event)=>{
  const langs = await languages();
  win.webContents.send('languages', langs);
});

ipcMain.on('findFilm', async(event, title, year, language, page)=>{
  const response = await searchMovie(title, year, language, page);
  win.webContents.send('findFilm', response);
});

ipcMain.on('foundFilm', async(event, title, year, uuid, id)=>{
  let indexFound = films.findIndex((film) => film.uuid === uuid);
  if (indexFound !== -1){
    const extension = extractExtension(films[indexFound].path);
    films[indexFound].nameToRename=`${title} (${year}) {tmdb-${id}}.${extension}`;
  }
  win.webContents.send('updatedFilms', films);
});

ipcMain.on('renameAll', async(event)=>{
  var errors = [];
  for (let i = 0; i < films.length; i++) {
    if (films[i].state !== State.COMPLETED){
      try{
        await FileProcesser.rename(films[i]);
        films[i].state = State.COMPLETED;
      }catch(e){
        console.error(e);
        errors.push(e);
        continue;
      }
    }
  }
  win.webContents.send('updatedFilms', films);
  if (errors.length > 0) win.webContents.send('renameAllErrors', errors);
});

ipcMain.on('deleteFilm', async(event, uuid)=>{
  let indexFound = films.findIndex((film) => film.uuid === uuid);
  if (indexFound !== -1){
    films.splice(indexFound, 1);
    win.webContents.send('updatedFilms', films);
  }
});