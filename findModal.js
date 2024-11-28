function openFindModal(type, title, year, moviePosition){

    const modal = document.getElementById('movieModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const searchForm = document.getElementById('searchForm');
    const mediaModalLangInput = document.getElementById('mediaModalLangInput');
    const findResults = document.getElementById('findResults');
    const pagination = document.getElementById('pagination');

    document.getElementById('moviePosition').value = moviePosition;
    document.getElementById('type').value = type;

    const openModal = () => {
      findResults.innerHTML = '';
      document.getElementById('title').value = title;
      document.getElementById('year').value = (year) ? year : "";
      document.getElementById('mediaModalLangInput').value = localStorage.getItem('lang').toLocaleUpperCase();
      modal.classList.add('is-active');
    }

    closeModalBtn.addEventListener('click', () =>  modal.classList.remove('is-active'));

    searchForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const title = document.getElementById('title').value;
      const year = document.getElementById('year').value || null;
      if (document.getElementById('type').value === 'FILMS'){
        ipcRenderer.send('film:find', title, year, 1);
      }else{
        ipcRenderer.send('tvShow:find', title, year, 1);
      }
    });

    ipcRenderer.on('media:response', (event, response)=>{
      findResults.innerHTML = '';
      if (response.total_results === 0) {
        findResults.innerHTML = '<p>No movies/tvshows match your search</p>';
      }else{
        setupPagination(response.total_pages);
        response.results.forEach(media => {
            const releaseYear = media.release_date ? media.release_date.split('-')[0] : media.first_air_date ? media.first_air_date.split('-')[0] : 'Unknown';
            const title = media.title ? media.title : media.name ? media.name : 'Unknown';
            const mediaElement = `
              <div class="columns is-multiline">
                <div class="column is-one-quarter">
                  <figure class="image">
                    <img src="https://image.tmdb.org/t/p/w500/${media.poster_path}" alt="${title}">
                  </figure>
                </div>
                <div class="column is-three-quarters">
                  <div class="movie-card">
                    <h2 class="subtitle">
                        <a href="#" class="movie-link" data-title="${title}" data-year="${releaseYear}" data-id="${media.id}">
                          ${title} - ${releaseYear}
                        </a>
                    </h2>
                    <p>${media.overview}</p>
                  </div>
                </div>
              </div>
            `;
            findResults.innerHTML += mediaElement;
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

        if (document.getElementById('type').value === 'FILMS'){
          ipcRenderer.send('film:found', title, year, id, document.getElementById('moviePosition').value);
        }else{
          ipcRenderer.send('tvShow:found', title, year);
        }
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
              'film:find', 
              document.getElementById('title').value, 
              document.getElementById('year').value, 
              page);
        });
      });
    }
    
    openModal();
}