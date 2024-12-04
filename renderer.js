const { ipcRenderer, webUtils } = require('electron');
const { Movie, State } = require('./dto/file.js');
const { Settings } = require('./dto/settings.js');

document.addEventListener('DOMContentLoaded', () => {

    if (process.env.NODE_ENV === 'test') { 
        webUtils.getPathForFile = function(file) {
            return `./tests/tmp/${file.name}`; 
        }; 
    }

    //TABS:
    const e = document.querySelectorAll(".tabs");
    void 0 !== e && e.forEach(e => {
        e.children[0].addEventListener("click", e => {
            var node = e.target;
            var nodename = '';
            while (node.localName != "ul") {
                if (node.localName == "a") nodename = node.innerText;
                node = node.parentNode;
            }
            var a = 0;
            Array.from(node.children).forEach(function (n) {
                n.classList.remove("is-active"),
                    a++,
                    node.parentNode.children[1].children[a - 1].style.display = "none",
                    nodename == n.children[0].innerText && (n.classList.add("is-active"),
                        node.parentNode.children[1].children[a - 1].style.display = "block")
            })

        })
    });

    //SETTINGS:
    const lang = localStorage.getItem('lang');
    if (lang){
        ipcRenderer.send('settings:get',
            new Settings(
                localStorage.getItem("lang"),
                localStorage.getItem("includeAdult")
            )
        );
    }else{
        openSettingsModal();
    }

    //DRAG & DROP:

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
            ipcRenderer.send('tvShow:isFolder', webUtils.getPathForFile(folders[0]));
        }else{
            win.webContents.send('okNotification:show', 'Only one folder at a time');
        }
    });

    document.getElementById('renameFilmsButton').addEventListener('click', () => {
        ipcRenderer.send('films:rename');
    });

    document.getElementById('renameTvShowsButton').addEventListener('click', () => {
        const inputs = Array.from(document.querySelectorAll('#episodesList input'));
        let results = inputs.map((input)=>({
            path: input.dataset.path,
            type: input.dataset.type, //'season' - 'episode',
            value: parseInt(input.value, 10)
        }));
        ipcRenderer.send('tvShow:rename', results);
    });

    //ipcRenderer

    ipcRenderer.on('films:updated', (event, films) => {

        let tableBody = document.getElementById('filmsList');
        tableBody.innerHTML = '';

        for (let i = 0; i < films.length; i++) {
            
            const row = document.createElement('tr');
            row.classList.add('has-text-left');

            const nameCell = document.createElement('td');
            nameCell.textContent = films[i].path.split('/').pop();
            row.appendChild(nameCell);

            const nameToRenameCell = document.createElement('td');
            if (films[i].nameToRename !== null && films[i].nameToRename !== undefined){
                nameToRenameCell.textContent = films[i].nameToRename;
            }
            row.appendChild(nameToRenameCell);

            const stateCell = document.createElement('td');
            if (films[i].state === State.INIT){
                const progressDiv = document.createElement('div');
                progressDiv.classList.add('circular-progress');
                stateCell.appendChild(progressDiv);
            }
            if (films[i].state === State.FOUND_DONE){
                let findButton = document.createElement('button');
                findButton.textContent = 'Find';
                findButton.classList.add('button', 'is-primary');
                findButton.style.marginLeft = '10px'; 
                findButton.addEventListener('click', () => openFindModal('FILMS', films[i].suggestedTitle, films[i].suggestedYear, i));
                stateCell.appendChild(findButton);

                let deleteButton = document.createElement('button');
                deleteButton.textContent = 'Remove';
                deleteButton.classList.add('button', 'is-danger');
                deleteButton.style.marginLeft = '10px'; 
                deleteButton.addEventListener('click', () => deleteFilm(films[i].id));
                stateCell.appendChild(deleteButton);
            }
            if (films[i].state === State.COMPLETED){
                const doneDiv = document.createElement('div');
                doneDiv.innerHTML = '&#9989;';
                stateCell.appendChild(doneDiv);
            }

            row.appendChild(stateCell);
            
            tableBody.appendChild(row);
        };
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
            findButton.addEventListener('click', () => openFindModal('TV_SHOW', tvShow.suggestedTitle, tvShow.suggestedYear));
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

        if (tvShow.state !== State.COMPLETED){

            tvShow.episodes.sort((a, b) => {
                if (a.path < b.path) {
                    return 1;  // Decreciente
                } else if (a.path > b.path) {
                    return -1;
                }
                return 0;
            });

            for (let i=0; i<tvShow.episodes.length; i++){
                row = document.createElement('tr');
                row.classList.add('has-text-left');

                const nameCell = document.createElement('td');
                nameCell.textContent = tvShow.episodes[i].path.split('/').pop();
                row.appendChild(nameCell);

                const sessionCell = document.createElement('td');
                const sessionInput = document.createElement('input');
                sessionInput.type = 'number';
                sessionInput.value = tvShow.episodes[i].season;
                sessionInput.max = 999;
                sessionInput.min = 1;
                sessionInput.maxLength = 3;
                sessionInput.classList.add('input', 'is-small');
                sessionInput.dataset.path = tvShow.episodes[i].path;
                sessionInput.dataset.type = 'season';
                sessionCell.appendChild(sessionInput);
                row.appendChild(sessionCell);

                const episodeCell = document.createElement('td');
                const episodeInput = document.createElement('input');
                episodeInput.type = 'number';
                episodeInput.value = tvShow.episodes[i].episode;
                episodeInput.max = 999;
                episodeInput.min = 1;
                episodeInput.maxLength = 3;
                episodeInput.classList.add('input', 'is-small');
                episodeInput.dataset.path = tvShow.episodes[i].path;
                episodeInput.dataset.type = 'episode';
                episodeCell.appendChild(episodeInput);
                row.appendChild(episodeCell);

                let deleteButton = document.createElement('button');
                deleteButton.textContent = 'Remove';
                deleteButton.classList.add('button', 'is-danger');
                deleteButton.style.marginLeft = '10px'; 
                deleteButton.addEventListener('click', () => deleteTvShow(i));
                stateCell.appendChild(deleteButton);
                row.appendChild(deleteButton);

                episodesTableBody.appendChild(row);
            }
        }
    });

    ipcRenderer.on('openSettingsModal', () => openSettingsModal());

    const deleteFilm = (id) => ipcRenderer.send('film:delete', id);
    const deleteTvShow = (index) => ipcRenderer.send('tvShow:delete', index);
    const hideOKNotification = (id) => document.getElementById(id).classList.add('is-hidden');

    ipcRenderer.on('okNotification:show', (event, message) => {
        const notification = document.getElementById('notificationOkDiv');
        const notificationText = document.getElementById('notificationText');
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.classList.remove('is-hidden');
            setTimeout(() => notification.classList.add('is-hidden'), 3000);
        }
    });

});
