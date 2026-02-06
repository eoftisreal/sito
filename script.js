// Movie database with placeholder images (using placeholder service)
const movies = [
    {
        title: "The Matrix",
        screenshot: "https://via.placeholder.com/800x450/000000/00FF00?text=The+Matrix",
        hints: ["matrix", "neo", "keanu"]
    },
    {
        title: "Inception",
        screenshot: "https://via.placeholder.com/800x450/1a1a2e/16a085?text=Inception",
        hints: ["inception", "dream", "leo"]
    },
    {
        title: "Titanic",
        screenshot: "https://via.placeholder.com/800x450/1e3a8a/93c5fd?text=Titanic",
        hints: ["titanic", "ship", "rose"]
    },
    {
        title: "The Godfather",
        screenshot: "https://via.placeholder.com/800x450/1c1c1c/d4af37?text=The+Godfather",
        hints: ["godfather", "vito", "corleone"]
    },
    {
        title: "Pulp Fiction",
        screenshot: "https://via.placeholder.com/800x450/000000/ff0000?text=Pulp+Fiction",
        hints: ["pulp", "fiction", "vincent"]
    },
    {
        title: "Forrest Gump",
        screenshot: "https://via.placeholder.com/800x450/8b4513/ffffff?text=Forrest+Gump",
        hints: ["forrest", "gump", "jenny"]
    },
    {
        title: "The Dark Knight",
        screenshot: "https://via.placeholder.com/800x450/1a1a1a/ffd700?text=The+Dark+Knight",
        hints: ["dark", "knight", "batman", "joker"]
    },
    {
        title: "Avatar",
        screenshot: "https://via.placeholder.com/800x450/0f4c81/39ff14?text=Avatar",
        hints: ["avatar", "pandora", "jake"]
    },
    {
        title: "Star Wars",
        screenshot: "https://via.placeholder.com/800x450/000000/FFE81F?text=Star+Wars",
        hints: ["star", "wars", "luke", "vader"]
    },
    {
        title: "Jurassic Park",
        screenshot: "https://via.placeholder.com/800x450/1a4d2e/ff0000?text=Jurassic+Park",
        hints: ["jurassic", "park", "dinosaur"]
    }
];

// Game state
let currentMovieIndex = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let shuffledMovies = [];

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const skipBtn = document.getElementById('skip-btn');
const restartBtn = document.getElementById('restart-btn');
const answerInput = document.getElementById('answer-input');
const movieScreenshot = document.getElementById('movie-screenshot');
const scoreElement = document.getElementById('score');
const streakElement = document.getElementById('streak');
const currentMovieElement = document.getElementById('current-movie');
const totalMoviesElement = document.getElementById('total-movies');
const feedbackElement = document.getElementById('feedback');
const finalScoreElement = document.getElementById('final-score');
const correctCountElement = document.getElementById('correct-count');
const wrongCountElement = document.getElementById('wrong-count');
const bestStreakElement = document.getElementById('best-streak');

// Initialize game
function initGame() {
    shuffledMovies = [...movies].sort(() => Math.random() - 0.5);
    currentMovieIndex = 0;
    score = 0;
    streak = 0;
    bestStreak = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    updateScore();
    updateStreak();
}

// Start game
function startGame() {
    initGame();
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    totalMoviesElement.textContent = shuffledMovies.length;
    loadMovie();
}

// Load current movie
function loadMovie() {
    if (currentMovieIndex >= shuffledMovies.length) {
        endGame();
        return;
    }

    const movie = shuffledMovies[currentMovieIndex];
    movieScreenshot.src = movie.screenshot;
    currentMovieElement.textContent = currentMovieIndex + 1;
    answerInput.value = '';
    feedbackElement.classList.remove('show', 'correct', 'wrong');
    answerInput.focus();
}

// Check answer
function checkAnswer() {
    const userAnswer = answerInput.value.trim().toLowerCase();
    
    if (!userAnswer) {
        return;
    }

    const movie = shuffledMovies[currentMovieIndex];
    const correctTitle = movie.title.toLowerCase();
    
    // Check if answer matches title or any hints
    const isCorrect = userAnswer === correctTitle || 
                     movie.hints.some(hint => userAnswer.includes(hint) || hint.includes(userAnswer));

    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }

    // Move to next movie after delay
    setTimeout(() => {
        currentMovieIndex++;
        loadMovie();
    }, 2000);
}

// Handle correct answer
function handleCorrectAnswer() {
    correctAnswers++;
    streak++;
    
    if (streak > bestStreak) {
        bestStreak = streak;
    }
    
    // Calculate points: base 10 + streak bonus
    const points = 10 + (streak - 1) * 5;
    score += points;
    
    updateScore();
    updateStreak();
    
    showFeedback(true, `Correct! +${points} points${streak > 1 ? ' (Streak x' + streak + ')' : ''}`);
}

// Handle wrong answer
function handleWrongAnswer() {
    wrongAnswers++;
    streak = 0;
    
    updateStreak();
    
    const correctTitle = shuffledMovies[currentMovieIndex].title;
    showFeedback(false, `Wrong! The correct answer was "${correctTitle}"`);
}

// Skip movie
function skipMovie() {
    wrongAnswers++;
    streak = 0;
    updateStreak();
    
    const correctTitle = shuffledMovies[currentMovieIndex].title;
    showFeedback(false, `Skipped! The answer was "${correctTitle}"`);
    
    setTimeout(() => {
        currentMovieIndex++;
        loadMovie();
    }, 2000);
}

// Show feedback
function showFeedback(isCorrect, message) {
    feedbackElement.textContent = message;
    feedbackElement.classList.add('show');
    feedbackElement.classList.add(isCorrect ? 'correct' : 'wrong');
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
}

// Update streak display
function updateStreak() {
    streakElement.textContent = streak;
}

// End game
function endGame() {
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
    
    finalScoreElement.textContent = score;
    correctCountElement.textContent = correctAnswers;
    wrongCountElement.textContent = wrongAnswers;
    bestStreakElement.textContent = bestStreak;
}

// Restart game
function restartGame() {
    endScreen.classList.remove('active');
    startScreen.classList.add('active');
}

// Event listeners
startBtn.addEventListener('click', startGame);
submitBtn.addEventListener('click', checkAnswer);
skipBtn.addEventListener('click', skipMovie);
restartBtn.addEventListener('click', restartGame);

// Allow Enter key to submit answer
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});
