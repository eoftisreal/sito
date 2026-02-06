// API Configuration
const API_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`;

// Game State
let movies = [];
let players = [];
let currentMovieIndex = 0;
let pastReferees = []; // Track who has been referee
let categoryOrder = ['Hollywood', 'Bollywood', 'Guess the Eyes', 'Dialogue']; // Fixed order

// DOM Elements
const startScreen = document.getElementById('start-screen');
const videoScreen = document.getElementById('video-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

// Buttons
const startBtn = document.getElementById('start-btn');
const skipVideoBtn = document.getElementById('skip-video-btn');
const revealBtn = document.getElementById('reveal-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const refereeBtn = document.getElementById('referee-btn');
const startTimerBtn = document.getElementById('start-timer-btn');

// Video
const introVideo = document.getElementById('intro-video');

// Game Elements
const movieScreenshot = document.getElementById('movie-screenshot');
const movieTitleDisplay = document.getElementById('movie-title-display');
const revealOverlay = document.getElementById('reveal-overlay');
const currentMovieNum = document.getElementById('current-movie');
const totalMoviesNum = document.getElementById('total-movies');
const activePlayersGrid = document.getElementById('active-players-grid');
const winnerDisplay = document.getElementById('winner-display');
const screenshotFrame = document.querySelector('.screenshot-frame');
const timerDisplay = document.getElementById('timer-display');

// Timer State
let timerInterval = null;

// Referee Elements
const refereeModal = document.getElementById('referee-modal');
const refereeResult = document.getElementById('referee-result');
const closeModal = document.querySelector('.close-modal');

// Event Listeners
startBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    videoScreen.classList.add('active');
    introVideo.currentTime = 0;
    introVideo.play().catch(e => console.log("Autoplay prevented:", e));

    // Auto-advance when video ends
    introVideo.onended = () => startGame();
});

// Referee Picker
refereeBtn.addEventListener('click', () => {
    triggerRefereePicker();
});

function triggerRefereePicker() {
    // Filter out players who have already been referee
    const eligiblePlayers = players.filter(p => !pastReferees.includes(p.name));

    // If everyone has been referee, reset the pool (or could just pick from anyone)
    const pool = eligiblePlayers.length > 0 ? eligiblePlayers : players;

    if (pool.length === 0) {
        alert("No players available to pick from!");
        return;
    }

    refereeModal.style.display = 'flex';
    refereeModal.classList.add('active');

    let counter = 0;
    const totalIterations = 30; // Number of shuffles
    const intervalTime = 100; // Speed of shuffle

    const shuffleInterval = setInterval(() => {
        const randomPlayer = pool[Math.floor(Math.random() * pool.length)];
        const photoUrl = randomPlayer.photo ? randomPlayer.photo : `https://ui-avatars.com/api/?name=${randomPlayer.name}&background=random`;

        refereeResult.innerHTML = `
            <div class="winner-card referee-card-anim">
                <img src="${photoUrl}" class="winner-avatar referee-avatar-anim">
                <h1 class="glow-text referee-name-anim">${randomPlayer.name}</h1>
            </div>
        `;

        counter++;
        if (counter >= totalIterations) {
            clearInterval(shuffleInterval);
            finalizeReferee(pool);
        }
    }, intervalTime);
}

function finalizeReferee(pool) {
    const randomPlayer = pool[Math.floor(Math.random() * pool.length)];
    const photoUrl = randomPlayer.photo ? randomPlayer.photo : `https://ui-avatars.com/api/?name=${randomPlayer.name}&background=random`;

    // Add to past referees
    if (!pastReferees.includes(randomPlayer.name)) {
        pastReferees.push(randomPlayer.name);
    }

    refereeResult.innerHTML = `
        <div class="winner-card referee-card-final">
            <div class="referee-badge">OFFICIAL REFEREE</div>
            <img src="${photoUrl}" class="winner-avatar referee-avatar-final">
            <h1 class="glow-text referee-name-final">${randomPlayer.name}</h1>
        </div>
    `;
}

closeModal.addEventListener('click', () => {
    refereeModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === refereeModal) {
        refereeModal.style.display = 'none';
    }
});

skipVideoBtn.addEventListener('click', () => {
    introVideo.pause();
    startGame();
});

revealBtn.addEventListener('click', () => {
    revealOverlay.classList.add('show');
    stopTimer();
});

nextBtn.addEventListener('click', () => {
    currentMovieIndex++;
    if (currentMovieIndex >= movies.length) {
        endGame();
    } else {
        loadMovie();
    }
});

startTimerBtn.addEventListener('click', () => {
    startTimer();
});

function startTimer() {
    stopTimer(); // Clear existing
    let timeLeft = 15;
    timerDisplay.textContent = timeLeft;
    timerDisplay.classList.add('active');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 5) {
            timerDisplay.classList.add('warning');
        }

        if (timeLeft <= 0) {
            stopTimer();
            timerDisplay.textContent = "TIME UP";
            // Optional: Play buzzer sound here
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerDisplay.classList.remove('active', 'warning');
    timerDisplay.textContent = "15";
}

restartBtn.addEventListener('click', () => {
    location.reload();
});

// Functions
async function startGame() {
    videoScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    await Promise.all([loadMovies(), loadPlayers()]);
    
    if (movies.length > 0) {
        // Sort/Group movies by Category Order
        const groupedMovies = [];
        categoryOrder.forEach(cat => {
            // Get all movies in this category
            const catMovies = movies.filter(m => (m.category || 'Hollywood') === cat);
            // Shuffle them internally
            catMovies.sort(() => Math.random() - 0.5);
            groupedMovies.push(...catMovies);
        });

        // Add any movies that don't match known categories at the end
        const otherMovies = movies.filter(m => !categoryOrder.includes(m.category || 'Hollywood'));
        groupedMovies.push(...otherMovies);

        movies = groupedMovies;
        totalMoviesNum.textContent = movies.length;

        // Initial Referee Pick
        // setTimeout(() => triggerRefereePicker(), 1000); // Optional: pick first referee automatically

        loadMovie();
    } else {
        alert("No movies found! Please add movies in Admin Panel.");
    }
}

async function loadMovies() {
    try {
        const res = await fetch(`${API_URL}/movies`);
        movies = await res.json();
    } catch (e) {
        console.error("Error loading movies:", e);
    }
}

function loadMovie() {
    stopTimer(); // Reset timer on new movie
    const movie = movies[currentMovieIndex];
    const prevMovie = movies[currentMovieIndex - 1];

    // Check for Category Change
    const currentCategory = movie.category || 'Hollywood';
    const prevCategory = prevMovie ? (prevMovie.category || 'Hollywood') : null;

    // If category changed (and it's not the very first movie), trigger referee
    if (prevCategory && currentCategory !== prevCategory) {
        // Delay slightly to let the UI update
        setTimeout(() => {
            alert(`Next Category: ${currentCategory}! Picking new referee...`);
            triggerRefereePicker();
        }, 500);
    }

    // Display Logic
    if (currentCategory === 'Dialogue') {
        // Text based
        movieScreenshot.style.display = 'none';

        // Check if text container exists, if not create/reuse
        let dialogueContainer = document.getElementById('dialogue-display');
        if (!dialogueContainer) {
            dialogueContainer = document.createElement('div');
            dialogueContainer.id = 'dialogue-display';
            dialogueContainer.className = 'dialogue-display-game';
            screenshotFrame.insertBefore(dialogueContainer, revealOverlay);
        }
        dialogueContainer.style.display = 'flex';
        dialogueContainer.textContent = `"${movie.dialogue || '...'}"`;

    } else {
        // Image based
        movieScreenshot.style.display = 'block';
        movieScreenshot.src = movie.screenshot;

        const dialogueContainer = document.getElementById('dialogue-display');
        if (dialogueContainer) {
            dialogueContainer.style.display = 'none';
        }
    }

    movieTitleDisplay.textContent = movie.title;
    revealOverlay.classList.remove('show');
    currentMovieNum.textContent = currentMovieIndex + 1;
}

async function loadPlayers() {
    try {
        const res = await fetch(`${API_URL}/players`);
        players = await res.json();
        renderPlayers();
    } catch (e) {
        console.error("Error loading players:", e);
    }
}

function renderPlayers() {
    activePlayersGrid.innerHTML = '';

    // Sort by score (Highest first)
    players.sort((a, b) => b.score - a.score);

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';

        const photoUrl = player.photo ? player.photo : `https://ui-avatars.com/api/?name=${player.name}&background=random`;

        card.innerHTML = `
            <img src="${photoUrl}" alt="${player.name}" class="player-avatar">
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-score">${player.score} pts</div>
            </div>
            <div class="score-controls">
                <button class="btn-score btn-plus" onclick="updateScore('${player.name}', 10)">+</button>
                <button class="btn-score btn-minus" onclick="updateScore('${player.name}', -5)">-</button>
            </div>
        `;
        activePlayersGrid.appendChild(card);
    });
}

async function updateScore(name, points) {
    try {
        await fetch(`${API_URL}/players/${encodeURIComponent(name)}/score`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points })
        });

        // Update local state and re-render
        const player = players.find(p => p.name === name);
        if (player) {
            player.score += points;

            // Play sound if points > 0 and player has sound
            if (points > 0 && player.sound) {
                try {
                    const audio = new Audio(player.sound);
                    audio.play().catch(e => console.log("Audio play failed:", e));
                } catch (audioErr) {
                    console.error("Error playing sound:", audioErr);
                }
            }

            renderPlayers();
        }
    } catch (e) {
        console.error("Error updating score:", e);
    }
}

function endGame() {
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
    
    if (players.length > 0) {
        const winner = players[0]; // Already sorted
        const photoUrl = winner.photo ? winner.photo : `https://ui-avatars.com/api/?name=${winner.name}&background=random`;

        winnerDisplay.innerHTML = `
            <div class="winner-card">
                <img src="${photoUrl}" class="winner-avatar">
                <h2>WINNER</h2>
                <h1 class="glow-text">${winner.name}</h1>
                <h3>${winner.score} Points</h3>
            </div>
        `;

        // Trigger Confetti
        if (window.confetti) {
            window.confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }
}

// Global scope for HTML onclick
window.updateScore = updateScore;
