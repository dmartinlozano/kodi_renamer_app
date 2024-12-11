// Function to open the modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('is-active');
  }
}

// Function to close the modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('is-active');
  }
}

// Function to set up pagination and handle page clicks
function setupPagination(totalPages, onPageClick) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = `<a class="pagination-link" href="#" data-page="${i}">${i}</a>`;
    pagination.innerHTML += pageButton;
  }

  const pageButtons = document.querySelectorAll('.pagination-link');
  pageButtons.forEach(button => {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      const page = this.getAttribute('data-page');
      onPageClick(page);
    });
  });
}

// Function to render search results
function renderResults(response) {
  const findResults = document.getElementById('findResults');
  if (!findResults) return;

  findResults.innerHTML = '';
  if (response.total_results === 0) {
    findResults.innerHTML = '<p>No movies/tvshows match your search</p>';
  } else {
    response.results.forEach(media => {
      const releaseYear = media.release_date ? media.release_date.split('-')[0] : media.first_air_date ? media.first_air_date.split('-')[0]: 'Unknown';
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
}

// Function to open the find modal with appropriate data
function openFindModal(type, title, year, moviePosition) {
  document.getElementById('moviePosition').value = moviePosition;
  document.getElementById('type').value = type;
  document.getElementById('title').value = title || '';
  document.getElementById('year').value = year || '';
  document.getElementById('mediaModalLangInput').value = localStorage.getItem('lang').toUpperCase();
  openModal('movieModal');
}

// Listen for media search responses
ipcRenderer.on('media:response', (event, response) => {
  renderResults(response);
  setupPagination(response.total_pages, (page) => {
    ipcRenderer.send(
      'film:find',
      document.getElementById('title').value,
      document.getElementById('year').value,
      page
    );
  });
});

// Initialize all necessary event listeners
document.addEventListener('DOMContentLoaded', () => {
  const closeModalBtn = document.getElementById('closeModalBtn');
  const searchForm = document.getElementById('searchForm');

  if (closeModalBtn)  closeModalBtn.addEventListener('click', () => closeModal('movieModal'));

  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      
      event.preventDefault();
      const title = document.getElementById('title').value;
      const year = document.getElementById('year').value || null;
      const type = document.getElementById('type').value;

      if (type === 'FILMS') {
        ipcRenderer.send('film:find', title, year, 1);
      } else {
        ipcRenderer.send('tvShow:find', title, year, 1);
      }
    });
  }

  document.addEventListener('click', function (event) {
    if (event.target && event.target.matches('a.movie-link')) {
      event.preventDefault();
      closeModal('movieModal');

      const title = event.target.getAttribute('data-title');
      const year = event.target.getAttribute('data-year');
      const id = event.target.getAttribute('data-id');
      const type = document.getElementById('type').value;

      if (type === 'FILMS') {
        ipcRenderer.send('film:found', title, year, id, document.getElementById('moviePosition').value);
      } else {
        ipcRenderer.send('tvShow:found', title, year);
      }
    }
  });
});