function openSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    const closeModalButton = document.getElementById('closeModal');
    const cancelModalButton = document.getElementById('cancelModal');
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const languageSelector = document.getElementById('languageSelector');
    const includeAdultCheck = document.getElementById('includeAdult');
    const customTmdbApiKeyInput = document.getElementById('customTmdbApiKey');

    ipcRenderer.send('languages');

    const openModal = () => settingsModal.classList.add('is-active');
    const closeModal = () => settingsModal.classList.remove('is-active');

    ipcRenderer.on('languages', (event, langs)=>{
        langs.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.iso_639_1;
            option.textContent = lang.english_name; 
            languageSelector.appendChild(option);
        });
        if (localStorage.getItem('lang')) languageSelector.value = localStorage.getItem('lang');
    });

    includeAdultCheck.checked = localStorage.getItem("includeAdult") === 'true';
    customTmdbApiKeyInput.value = localStorage.getItem("customTmdbApiKey");

    closeModalButton.addEventListener('click', closeModal);
    cancelModalButton.addEventListener('click', closeModal);
    saveSettingsButton.addEventListener('click', () => {
        localStorage.setItem('lang', languageSelector.value);
        localStorage.setItem('includeAdult', includeAdultCheck.checked);
        localStorage.setItem('customTmdbApiKey', customTmdbApiKeyInput.value);
        ipcRenderer.send('settings:get', new Settings(
            languageSelector.value, 
            includeAdultCheck.checked,
            customTmdbApiKeyInput.value
        ));
        closeModal();
    });

    openModal();
};