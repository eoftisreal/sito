// Use relative URL to work in both local and codespace environments
const API_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`;
let isLoggedIn = false;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const adminPassword = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Movies elements
const addMovieForm = document.getElementById('add-movie-form');
const movieTitle = document.getElementById('movie-title');
const movieScreenshot = document.getElementById('movie-screenshot');
const movieHints = document.getElementById('movie-hints');
const imagePreview = document.getElementById('image-preview');
const moviesList = document.getElementById('movies-list');

// Players elements
const addPlayerForm = document.getElementById('add-player-form');
const playerName = document.getElementById('player-name');
const playerScore = document.getElementById('player-score');
const playersTbody = document.getElementById('players-tbody');

// Modal elements
const editModal = document.getElementById('edit-modal');
const editMovieForm = document.getElementById('edit-movie-form');
const editMovieId = document.getElementById('edit-movie-id');
const editMovieTitle = document.getElementById('edit-movie-title');
const editMovieScreenshot = document.getElementById('edit-movie-screenshot');
const editMovieHints = document.getElementById('edit-movie-hints');
const editImagePreview = document.getElementById('edit-image-preview');
const closeModal = document.querySelector('.close');

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPassword.value })
        });
        
        const data = await response.json();
        
        if (data.success) {
            isLoggedIn = true;
            loginScreen.classList.remove('active');
            adminDashboard.classList.add('active');
            loadMovies();
            loadPlayers();
            loginError.textContent = '';
        } else {
            loginError.textContent = 'Invalid password!';
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Connection error. Make sure the server is running!';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    isLoggedIn = false;
    adminDashboard.classList.remove('active');
    loginScreen.classList.add('active');
    adminPassword.value = '';
});

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        if (tabName === 'movies') {
            loadMovies();
        } else if (tabName === 'players') {
            loadPlayers();
        }
    });
});

// Image preview for add form
movieScreenshot.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Image preview for edit form
editMovieScreenshot.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            editImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Add movie
addMovieForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', movieTitle.value);
    formData.append('hints', movieHints.value);
    formData.append('screenshot', movieScreenshot.files[0]);
    
    try {
        const response = await fetch(`${API_URL}/movies`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Movie added successfully!');
            addMovieForm.reset();
            imagePreview.innerHTML = '';
            loadMovies();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error adding movie:', error);
        alert('Failed to add movie!');
    }
});

// Load movies
async function loadMovies() {
    try {
        const response = await fetch(`${API_URL}/movies`);
        const movies = await response.json();
        
        moviesList.innerHTML = '';
        
        if (movies.length === 0) {
            moviesList.innerHTML = '<p class="empty-state">No movies yet. Add your first movie!</p>';
            return;
        }
        
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.innerHTML = `
                <img src="${movie.screenshot}" alt="${movie.title}">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p class="hints">Hints: ${movie.hints.join(', ') || 'None'}</p>
                    <div class="movie-actions">
                        <button class="btn btn-small btn-edit" onclick="editMovie(${movie.id})">Edit</button>
                        <button class="btn btn-small btn-delete" onclick="deleteMovie(${movie.id})">Delete</button>
                    </div>
                </div>
            `;
            moviesList.appendChild(movieCard);
        });
    } catch (error) {
        console.error('Error loading movies:', error);
        moviesList.innerHTML = '<p class="error-state">Failed to load movies!</p>';
    }
}

// Edit movie
async function editMovie(id) {
    try {
        const response = await fetch(`${API_URL}/movies/${id}`);
        const movie = await response.json();
        
        editMovieId.value = movie.id;
        editMovieTitle.value = movie.title;
        editMovieHints.value = movie.hints.join(', ');
        editImagePreview.innerHTML = `<img src="${movie.screenshot}" alt="${movie.title}">`;
        
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading movie:', error);
        alert('Failed to load movie details!');
    }
}

// Update movie
editMovieForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const movieId = editMovieId.value;
    const formData = new FormData();
    formData.append('title', editMovieTitle.value);
    formData.append('hints', editMovieHints.value);
    
    if (editMovieScreenshot.files[0]) {
        formData.append('screenshot', editMovieScreenshot.files[0]);
    }
    
    try {
        const response = await fetch(`${API_URL}/movies/${movieId}`, {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Movie updated successfully!');
            editModal.style.display = 'none';
            editMovieForm.reset();
            editImagePreview.innerHTML = '';
            loadMovies();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating movie:', error);
        alert('Failed to update movie!');
    }
});

// Delete movie
async function deleteMovie(id) {
    if (!confirm('Are you sure you want to delete this movie?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/movies/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Movie deleted successfully!');
            loadMovies();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting movie:', error);
        alert('Failed to delete movie!');
    }
}

// Add/Update player
addPlayerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: playerName.value,
                score: parseInt(playerScore.value) || 0
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Player added/updated successfully!');
            addPlayerForm.reset();
            loadPlayers();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Failed to add player!');
    }
});

// Load players
async function loadPlayers() {
    try {
        const response = await fetch(`${API_URL}/players`);
        const players = await response.json();
        
        playersTbody.innerHTML = '';
        
        if (players.length === 0) {
            playersTbody.innerHTML = '<tr><td colspan="4" class="empty-state">No players yet.</td></tr>';
            return;
        }
        
        // Sort by score descending
        players.sort((a, b) => b.score - a.score);
        
        players.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.score}</td>
                <td>
                    <button class="btn btn-small btn-success" onclick="addPoints('${player.name}', 10)">+10</button>
                    <button class="btn btn-small btn-success" onclick="addPoints('${player.name}', 5)">+5</button>
                    <button class="btn btn-small btn-warning" onclick="addPoints('${player.name}', -5)">-5</button>
                </td>
            `;
            playersTbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading players:', error);
        playersTbody.innerHTML = '<tr><td colspan="4" class="error-state">Failed to load players!</td></tr>';
    }
}

// Add points to player
async function addPoints(name, points) {
    try {
        const response = await fetch(`${API_URL}/players/${encodeURIComponent(name)}/score`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadPlayers();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating score:', error);
        alert('Failed to update score!');
    }
}

// Modal close
closeModal.addEventListener('click', () => {
    editModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.style.display = 'none';
    }
});

// Make functions global
window.editMovie = editMovie;
window.deleteMovie = deleteMovie;
window.addPoints = addPoints;
