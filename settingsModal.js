function openSettingsModal() {
    const languageModal = document.getElementById('languageModal');
    const closeModalButton = document.getElementById('closeModal');
    const cancelModalButton = document.getElementById('cancelModal');
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const languageSelector = document.getElementById('languageSelector');
    const includeAdultCheck = document.getElementById('includeAdult');

    ipcRenderer.send('languages');

    const openModal = () => languageModal.classList.add('is-active');
    const closeModal = () => languageModal.classList.remove('is-active');

    ipcRenderer.on('languages', (event, langs)=>{
        langs.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.iso_639_1;
            option.textContent = lang.english_name; 
            languageSelector.appendChild(option);
        });
        if (localStorage.getItem('lang')) languageSelector.value = localStorage.getItem('lang');
    });

    closeModalButton.addEventListener('click', closeModal);
    cancelModalButton.addEventListener('click', closeModal);
    saveSettingsButton.addEventListener('click', () => {
        let lang = languageSelector.value;
        let includeAdult = includeAdultCheck.checked;
        localStorage.setItem('lang', lang);
        localStorage.setItem('includeAdult', includeAdult);
        ipcRenderer.send('settings:get', new Settings(lang, includeAdult));
        closeModal();
    });

    openModal();
};