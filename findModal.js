function openFindModal(title, year, uuid){
    const modal = document.getElementById('movieModal');
    const languageSelector = document.getElementById('languageSelectorFindMovie');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const searchForm = document.getElementById('searchForm');
    const movieResults = document.getElementById('movieResults');
    const pagination = document.getElementById('pagination');

    const openModal = () => {
        ipcRenderer.send('languages');
        movieResults.innerHTML = '';
        document.getElementById('title').value = title;
        document.getElementById('year').value = (year) ? year : "";
        modal.classList.add('is-active');
    }
    closeModalBtn.addEventListener('click', () =>  modal.classList.remove('is-active'));

    ipcRenderer.on('languages', (event, langs)=>{
        langs.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.iso_639_1;
            option.textContent = lang.english_name; 
            languageSelector.appendChild(option);
        });
        languageSelector.value = localStorage.getItem('defaultLanguage') || systemLocale || 'en';
    });

    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const title = document.getElementById('title').value;
        const year = document.getElementById('year').value || null;
        const language = document.getElementById('languageSelectorFindMovie').value;
        ipcRenderer.send('findFilm', title, year, language, 1);
    });

    ipcRenderer.on('findFilm', (event, response)=>{
        movieResults.innerHTML = '';
        if (response.total_results === 0) {
            movieResults.innerHTML = '<p>No movies match your search</p>';
        }else{
            setupPagination(response.total_pages);
            response.results.forEach(movie => {
                const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
                const movieElement = `
                  <div class="columns is-multiline">
                    <div class="column is-one-quarter">
                      <figure class="image">
                        <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}">
                      </figure>
                    </div>
                    <div class="column is-three-quarters">
                      <div class="movie-card">
                        <h2 class="subtitle">
                            <a href="#" class="movie-link" data-title="${movie.title}" data-year="${releaseYear}" data-id="${movie.id}">
                                ${movie.title} - ${releaseYear}
                            </a>
                        </h2>
                        <p>${movie.overview}</p>
                      </div>
                    </div>
                  </div>
                `;
                movieResults.innerHTML += movieElement;
            });

        }
    });

    document.addEventListener('click', function(event) {
        if (event.target && event.target.matches('a.movie-link')) {
            event.preventDefault();
            const modal = document.getElementById('movieModal');
            modal.classList.remove('is-active');
            const title = event.target.getAttribute('data-title');
            const year = event.target.getAttribute('data-year');
            const id = event.target.getAttribute('data-id');
            ipcRenderer.send('foundFilm', title, year, uuid, id);  
            modal.classList.remove('is-active');
        }
    });

    const setupPagination = (totalPages) => {
      pagination.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const pageButton = `<a class="pagination-link" href="#" data-page="${i}">${i}</a>`;
        pagination.innerHTML += pageButton;
      }
      const pageButtons = document.querySelectorAll('.pagination-link');
      pageButtons.forEach(button => {
        button.addEventListener('click', function(event) {
          event.preventDefault();
          const page = this.getAttribute('data-page');
          ipcRenderer.send(
              'findFilm', 
              document.getElementById('title').value, 
              document.getElementById('year').value, 
              document.getElementById('languageSelectorFindMovie').value, 
              page);
        });
      });
    }
    
    openModal();
}

module.exports = { openFindModal };