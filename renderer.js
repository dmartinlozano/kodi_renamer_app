const { ipcRenderer, webUtils } = require('electron');
const { KRFile, Type, State } = require('./processer/file.js');

document.addEventListener('DOMContentLoaded', () => {

    const filmsDropArea = document.getElementById('filmsDropArea');

    filmsDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        filmsDropArea.classList.add('hover');
    });

    filmsDropArea.addEventListener('dragleave', () => filmsDropArea.classList.remove('hover'));

    filmsDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        filmsDropArea.classList.remove('hover');
        const files = Array.from(event.dataTransfer.files).filter(file => file.type !== '' || /\.[^/.]+$/.test(file.name));
        const lang = localStorage.getItem('defaultLanguage') || systemLocale || 'en';
        ipcRenderer.send('addFilm', files.map((film) => new KRFile(webUtils.getPathForFile(film), Type.FILMS)), lang);
    });

    ipcRenderer.on('updatedFilms', (event, films) => {
        tableBody = document.getElementById('filmsList');
        tableBody.innerHTML = '';
        Array.from(films).forEach((film) => {
            const row = document.createElement('tr');
            row.classList.add('has-text-left');

            const nameCell = document.createElement('td');
            nameCell.textContent = film.path.split('/').pop();
            row.appendChild(nameCell);

            const nameToRenameCell = document.createElement('td');
            if (film.nameToRename !== null && film.nameToRename !== undefined){
                nameToRenameCell.textContent = film.nameToRename;
            }
            row.appendChild(nameToRenameCell);

            const stateCell = document.createElement('td');
            if (film.state == State.INIT){
                const progressDiv = document.createElement('div');
                progressDiv.classList.add('circular-progress');
                stateCell.appendChild(progressDiv);
            }
            if (film.state = State.FOUND_DONE){
                let findButton = document.createElement('button');
                findButton.textContent = 'Find';
                findButton.classList.add('button', 'is-primary');
                findButton.style.marginLeft = '10px'; 
                findButton.addEventListener('click', () => openFindModal(film.suggestedTitle, film.suggestedYear, film.uuid));
                stateCell.appendChild(findButton);

                let deleteButton = document.createElement('button');
                deleteButton.textContent = 'Remove';
                deleteButton.classList.add('button', 'is-danger');
                deleteButton.style.marginLeft = '10px'; 
                deleteButton.addEventListener('click', () => deleteFilm(film.uuid));
                stateCell.appendChild(deleteButton);
            }
            if (film.state = State.COMPLETED){
                const doneDiv = document.createElement('div');
                doneDiv.textContent = '&#9989;';
                stateCell.appendChild(doneDiv);
            }

            row.appendChild(stateCell);
            
            tableBody.appendChild(row);
        });
    });

    ipcRenderer.on('openLanguageModal', (event, languages) => {
        openLanguageModal(languages); 
    });

    document.getElementById('renameAll').addEventListener('click', () => {
        ipcRenderer.send('renameAll');
    });

    const deleteFilm = (uuid) => {
        ipcRenderer.send('deleteFilm', uuid);
    };

});
