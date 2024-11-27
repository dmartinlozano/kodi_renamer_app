const args = process.argv.find(arg => arg.startsWith('--locale='));
const systemLocale = args ? args.split('=')[1] : 'en';

function openLanguageModal(languages) {
    const languageModal = document.getElementById('languageModal');
    const closeModalButton = document.getElementById('closeModal');
    const cancelModalButton = document.getElementById('cancelModal');
    const saveLanguageButton = document.getElementById('saveLanguage');
    const languageSelector = document.getElementById('languageSelector');

    const openModal = () => languageModal.classList.add('is-active');
    const closeModal = () => languageModal.classList.remove('is-active');

    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.iso_639_1;
        option.textContent = lang.english_name; 
        languageSelector.appendChild(option);
    });

    const saveLanguage = () => {
        const selectedLanguage = languageSelector.value;
        localStorage.setItem('defaultLanguage',selectedLanguage);
        closeModal();
    };

    closeModalButton.addEventListener('click', closeModal);
    cancelModalButton.addEventListener('click', closeModal);
    saveLanguageButton.addEventListener('click', saveLanguage);

    const savedLanguage = localStorage.getItem('defaultLanguage') || systemLocale || 'en';
    languageSelector.value = savedLanguage;

    openModal();
};

module.exports = { openLanguageModal };