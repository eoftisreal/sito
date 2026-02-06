// API Configuration - Use relative URL to work in both local and codespace environments
const API_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`;

// Game state
let movies = [];
let currentMovieIndex = 0;
let playerName = 'Guest';
let playerScore = 0;
let moviesShown = 0;

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const playerNameInput = document.getElementById('player-name-input');
const currentPlayerElement = document.getElementById('current-player');
const playerScoreElement = document.getElementById('player-score');
const movieScreenshot = document.getElementById('movie-screenshot');
const movieTitleDisplay = document.getElementById('movie-title-display');
const currentMovieElement = document.getElementById('current-movie');
const totalMoviesElement = document.getElementById('total-movies');
const feedbackElement = document.getElementById('feedback');
const finalScoreElement = document.getElementById('final-score');
const finalPlayerNameElement = document.getElementById('final-player-name');
const moviesCountElement = document.getElementById('movies-count');
const restartBtn = document.getElementById('restart-btn');

// Admin control buttons
const correctBtn = document.getElementById('correct-btn');
const wrongBtn = document.getElementById('wrong-btn');
const award5Btn = document.getElementById('award-5-btn');
const award20Btn = document.getElementById('award-20-btn');
const revealBtn = document.getElementById('reveal-btn');
const nextBtn = document.getElementById('next-btn');

// Load movies from API
async function loadMoviesFromAPI() {
    try {
        const response = await fetch(`${API_URL}/movies`);
        movies = await response.json();
        
        if (movies.length === 0) {
            alert('No movies available! Please add movies from the admin panel.');
            return false;
        }
        
        // Shuffle movies
        movies = movies.sort(() => Math.random() - 0.5);
        return true;
    } catch (error) {
        console.error('Error loading movies:', error);
        alert('Failed to load movies! Make sure the server is running on port 3000.');
        return false;
    }
}

// Initialize game
function initGame() {
    currentMovieIndex = 0;
    playerScore = 0;
    moviesShown = 0;
    updatePlayerScore();
}

// Start game
async function startGame() {
    const name = playerNameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name!');
        return;
    }
    
    playerName = name;
    
    // Load movies from API
    const loaded = await loadMoviesFromAPI();
    if (!loaded) return;
    
    initGame();
    currentPlayerElement.textContent = playerName;
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    totalMoviesElement.textContent = movies.length;
    loadMovie();
}

// Load current movie
function loadMovie() {
    if (currentMovieIndex >= movies.length) {
        endGame();
        return;
    }

    const movie = movies[currentMovieIndex];
    movieScreenshot.src = movie.screenshot;
    currentMovieElement.textContent = currentMovieIndex + 1;
    movieTitleDisplay.style.display = 'none';
    movieTitleDisplay.textContent = movie.title;
    feedbackElement.classList.remove('show', 'correct', 'wrong');
    moviesShown++;
}

// Handle correct answer
async function handleCorrect() {
    const points = 10;
    playerScore += points;
    updatePlayerScore();
    
    // Update score in backend
    await updatePlayerScoreAPI(playerName, points);
    
    showFeedback(true, `Correct! +${points} points`);
}

// Handle wrong answer
function handleWrong() {
    showFeedback(false, `Wrong answer!`);
}

// Award custom points
async function awardPoints(points) {
    playerScore += points;
    updatePlayerScore();
    
    // Update score in backend
    await updatePlayerScoreAPI(playerName, points);
    
    showFeedback(true, `Awarded ${points > 0 ? '+' : ''}${points} points!`);
}

// Reveal movie title
function revealAnswer() {
    movieTitleDisplay.style.display = 'block';
    showFeedback(true, 'Answer revealed!');
}

// Next movie
function nextMovie() {
    currentMovieIndex++;
    loadMovie();
}

// Update player score in API
async function updatePlayerScoreAPI(name, points) {
    try {
        await fetch(`${API_URL}/players/${encodeURIComponent(name)}/score`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points })
        });
    } catch (error) {
        console.error('Error updating score:', error);
    }
}

// Show feedback
function showFeedback(isCorrect, message) {
    feedbackElement.textContent = message;
    feedbackElement.classList.add('show');
    feedbackElement.classList.add(isCorrect ? 'correct' : 'wrong');
}

// Update player score display
function updatePlayerScore() {
    playerScoreElement.textContent = playerScore;
}

// End game
function endGame() {
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
    
    finalPlayerNameElement.textContent = playerName;
    finalScoreElement.textContent = playerScore;
    moviesCountElement.textContent = moviesShown;
}

// Restart game
function restartGame() {
    endScreen.classList.remove('active');
    startScreen.classList.add('active');
    playerNameInput.value = '';
}

// Event listeners
startBtn.addEventListener('click', startGame);
correctBtn.addEventListener('click', handleCorrect);
wrongBtn.addEventListener('click', handleWrong);
award5Btn.addEventListener('click', () => awardPoints(5));
award20Btn.addEventListener('click', () => awardPoints(20));
revealBtn.addEventListener('click', revealAnswer);
nextBtn.addEventListener('click', nextMovie);
restartBtn.addEventListener('click', restartGame);

// Allow Enter key to start game
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startGame();
    }
});
