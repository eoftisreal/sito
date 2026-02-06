const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'movie-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
        const allowedAudioTypes = /mp3|wav|ogg|mpeg/;
        const extname = path.extname(file.originalname).toLowerCase();
        
        const isImage = allowedImageTypes.test(extname) || allowedImageTypes.test(file.mimetype);
        const isAudio = allowedAudioTypes.test(extname) || allowedAudioTypes.test(file.mimetype);

        if (isImage || isAudio) {
            return cb(null, true);
        } else {
            cb(new Error('Only image and audio files are allowed!'));
        }
    }
});

// Data file path
const DATA_FILE = path.join(__dirname, 'movies-data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        movies: [
            {
                id: 1,
                title: "The Matrix",
                screenshot: "https://via.placeholder.com/800x450/000000/00FF00?text=The+Matrix",
                hints: ["matrix", "neo", "keanu"]
            },
            {
                id: 2,
                title: "Inception",
                screenshot: "https://via.placeholder.com/800x450/1a1a2e/16a085?text=Inception",
                hints: ["inception", "dream", "leo"]
            }
        ],
        players: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper functions
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return { movies: [], players: [] };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// Simple admin authentication (in production, use proper authentication)
const ADMIN_PASSWORD = 'admin123'; // Change this!

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// Get all movies
app.get('/api/movies', (req, res) => {
    const data = readData();
    res.json(data.movies);
});

// Get single movie
app.get('/api/movies/:id', (req, res) => {
    const data = readData();
    const movie = data.movies.find(m => m.id === parseInt(req.params.id));
    if (movie) {
        res.json(movie);
    } else {
        res.status(404).json({ error: 'Movie not found' });
    }
});

// Add new movie
app.post('/api/movies', upload.single('screenshot'), (req, res) => {
    try {
        const data = readData();
        const { title, hints, category, dialogue } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const newMovie = {
            id: data.movies.length > 0 ? Math.max(...data.movies.map(m => m.id)) + 1 : 1,
            title: title,
            category: category || 'Hollywood',
            dialogue: dialogue || '',
            screenshot: req.file ? `/uploads/${req.file.filename}` : '',
            hints: hints ? hints.split(',').map(h => h.trim().toLowerCase()) : []
        };
        
        data.movies.push(newMovie);
        
        if (writeData(data)) {
            res.json({ success: true, movie: newMovie });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update movie
app.put('/api/movies/:id', upload.single('screenshot'), (req, res) => {
    try {
        const data = readData();
        const movieIndex = data.movies.findIndex(m => m.id === parseInt(req.params.id));
        
        if (movieIndex === -1) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        const { title, hints, category, dialogue } = req.body;
        
        if (title) data.movies[movieIndex].title = title;
        if (category) data.movies[movieIndex].category = category;
        // Allow dialogue to be empty string if needed, but only update if provided or explicitly empty
        if (dialogue !== undefined) data.movies[movieIndex].dialogue = dialogue;
        if (hints) data.movies[movieIndex].hints = hints.split(',').map(h => h.trim().toLowerCase());
        if (req.file) data.movies[movieIndex].screenshot = `/uploads/${req.file.filename}`;
        
        if (writeData(data)) {
            res.json({ success: true, movie: data.movies[movieIndex] });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete movie
app.delete('/api/movies/:id', (req, res) => {
    try {
        const data = readData();
        const movieIndex = data.movies.findIndex(m => m.id === parseInt(req.params.id));
        
        if (movieIndex === -1) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        // Delete image file if it exists and is not a placeholder
        const movie = data.movies[movieIndex];
        if (movie.screenshot && movie.screenshot.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, movie.screenshot);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        data.movies.splice(movieIndex, 1);
        
        if (writeData(data)) {
            res.json({ success: true, message: 'Movie deleted' });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all players
app.get('/api/players', (req, res) => {
    const data = readData();
    res.json(data.players);
});

// Add or update player
app.post('/api/players', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'sound', maxCount: 1 }]), (req, res) => {
    try {
        const data = readData();
        const { name, score } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const existingPlayerIndex = data.players.findIndex(p => p.name === name);
        const files = req.files || {};
        
        if (existingPlayerIndex !== -1) {
            // Update existing player
            if (score !== undefined) data.players[existingPlayerIndex].score = parseInt(score);

            // Update photo
            if (files.photo && files.photo[0]) {
                if (data.players[existingPlayerIndex].photo && data.players[existingPlayerIndex].photo.startsWith('/uploads/')) {
                    const oldPath = path.join(__dirname, data.players[existingPlayerIndex].photo);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                data.players[existingPlayerIndex].photo = `/uploads/${files.photo[0].filename}`;
            }

            // Update sound
            if (files.sound && files.sound[0]) {
                if (data.players[existingPlayerIndex].sound && data.players[existingPlayerIndex].sound.startsWith('/uploads/')) {
                    const oldPath = path.join(__dirname, data.players[existingPlayerIndex].sound);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                data.players[existingPlayerIndex].sound = `/uploads/${files.sound[0].filename}`;
            }
        } else {
            // Create new player
            data.players.push({
                id: data.players.length > 0 ? Math.max(...data.players.map(p => p.id)) + 1 : 1,
                name: name,
                score: parseInt(score) || 0,
                photo: files.photo && files.photo[0] ? `/uploads/${files.photo[0].filename}` : null,
                sound: files.sound && files.sound[0] ? `/uploads/${files.sound[0].filename}` : null
            });
        }
        
        if (writeData(data)) {
            res.json({ success: true, players: data.players });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete player
app.delete('/api/players/:id', (req, res) => {
    try {
        const data = readData();
        const playerIndex = data.players.findIndex(p => p.id === parseInt(req.params.id));

        if (playerIndex === -1) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Delete photo file if it exists
        const player = data.players[playerIndex];
        if (player.photo && player.photo.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, player.photo);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        data.players.splice(playerIndex, 1);

        if (writeData(data)) {
            res.json({ success: true, message: 'Player deleted' });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update player score
app.put('/api/players/:name/score', (req, res) => {
    try {
        const data = readData();
        const { points } = req.body;
        const playerName = req.params.name;
        
        const playerIndex = data.players.findIndex(p => p.name === playerName);
        
        if (playerIndex !== -1) {
            data.players[playerIndex].score += parseInt(points) || 0;
        } else {
            data.players.push({
                id: data.players.length > 0 ? Math.max(...data.players.map(p => p.id)) + 1 : 1,
                name: playerName,
                score: parseInt(points) || 0
            });
        }
        
        if (writeData(data)) {
            res.json({ success: true, players: data.players });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Admin panel: http://0.0.0.0:${PORT}/admin.html`);
});
