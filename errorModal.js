document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeErrorModal').addEventListener('click', () => {
        document.getElementById('errorModal').classList.remove('is-active');
    });

    document.getElementById('closeErrorButton').addEventListener('click', () => {
        document.getElementById('errorModal').classList.remove('is-active');
    });

    ipcRenderer.on('errorNotification:show', (event, newMessage) => {
        const modal = document.getElementById('errorModal');
        const textarea = document.getElementById('errorDetails');
        textarea.value += `${newMessage}\n`;
        modal.classList.add('is-active');
    });
});