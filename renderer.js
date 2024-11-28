const { ipcRenderer, webUtils } = require('electron');
const { Movie, State } = require('./processer/file.js');

document.addEventListener('DOMContentLoaded', () => {

    const filmsDropArea = document.getElementById('filmsDropArea');
    const tvShowDropArea = document.getElementById('tvShowDropArea');

    filmsDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        filmsDropArea.classList.add('hover');
    });

    tvShowDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        tvShowDropArea.classList.add('hover');
    });

    filmsDropArea.addEventListener('dragleave', () => filmsDropArea.classList.remove('hover'));
    tvShowDropArea.addEventListener('dragleave', () => tvShowDropArea.classList.remove('hover'));

    filmsDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        filmsDropArea.classList.remove('hover');
        const files = Array.from(event.dataTransfer.files).filter(file => file.type !== '' || /\.[^/.]+$/.test(file.name));
        ipcRenderer.send('film:add', files.map((film) => new Movie(webUtils.getPathForFile(film))));
    });

    tvShowDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        filmsDropArea.classList.remove('hover');
        const folders = Array.from(event.dataTransfer.files);
        if (folders.length === 1) {
            const folderPath = webUtils.getPathForFile(folders[0]);
            ipcRenderer.send('tvShow:isFolder', folderPath);
        }
    });

    ipcRenderer.on('films:updated', (event, films) => {
        let tableBody = document.getElementById('filmsList');
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
                findButton.addEventListener('click', () => openFindModal('FILMS', film.suggestedTitle, film.suggestedYear, film.id));
                stateCell.appendChild(findButton);

                let deleteButton = document.createElement('button');
                deleteButton.textContent = 'Remove';
                deleteButton.classList.add('button', 'is-danger');
                deleteButton.style.marginLeft = '10px'; 
                deleteButton.addEventListener('click', () => deleteFilm(film.id));
                stateCell.appendChild(deleteButton);
            }
            if (film.state = State.COMPLETED){
                const doneDiv = document.createElement('div');
                doneDiv.innerHTML = '&#9989;';
                stateCell.appendChild(doneDiv);
            }

            row.appendChild(stateCell);
            
            tableBody.appendChild(row);
        });
    });

    ipcRenderer.on('tvShow:updated', (event, tvShow) => {

        //tv show table

        let tvShowTableBody = document.getElementById('tvShowList');
        tvShowTableBody.innerHTML = '';
        let row = document.createElement('tr');
        row.classList.add('has-text-left');

        const nameCell = document.createElement('td');
        nameCell.textContent = tvShow.path.split('/').pop();
        row.appendChild(nameCell);

        const nameToRenameCell = document.createElement('td');
        if (tvShow.nameToRename !== null && tvShow.nameToRename !== undefined){
            nameToRenameCell.textContent = tvShow.nameToRename;
        }
        row.appendChild(nameToRenameCell);

        const stateCell = document.createElement('td');
        if (tvShow.state === State.INIT){
            const progressDiv = document.createElement('div');
            progressDiv.classList.add('circular-progress');
            stateCell.appendChild(progressDiv);
        }
        if (tvShow.state === State.FOUND_DONE){
            let findButton = document.createElement('button');
            findButton.textContent = 'Find';
            findButton.classList.add('button', 'is-primary');
            findButton.style.marginLeft = '10px'; 
            findButton.addEventListener('click', () => openFindModal('TV_SHOW', tvShow.suggestedTitle, tvShow.suggestedYear, tvShow.id));
            stateCell.appendChild(findButton);
        }
        if (tvShow.state === State.COMPLETED){
            const doneDiv = document.createElement('div');
            doneDiv.innerHTML = '&#9989;';
            stateCell.appendChild(doneDiv);
        }

        row.appendChild(stateCell);

        tvShowTableBody.appendChild(row);

        //episodes table
        
        let episodesTableBody = document.getElementById('episodesList');
        episodesTableBody.innerHTML = '';

        for (let i=0; i<tvShow.episodes.length; i++){
            row = document.createElement('tr');
            row.classList.add('has-text-left');
            const nameCell = document.createElement('td');
            nameCell.textContent = tvShow.episodes[i].split('/').pop();
            row.appendChild(nameCell);
            episodesTableBody.appendChild(row);
        }
    });

    ipcRenderer.on('openLanguageModal', (event, languages) => {
        openLanguageModal(languages); 
    });

    document.getElementById('renameFilmsButton').addEventListener('click', () => {
        ipcRenderer.send('films:rename');
    });

    const deleteFilm = (id) => {
        ipcRenderer.send('film:delete', id);
    };

});
