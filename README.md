# Movie Guessing Game 🎬

An interactive movie guessing game where you try to identify movies from screenshots. Test your movie knowledge and earn points with the streak system!

## Features

- 🎯 **Point System**: Earn 10 points for each correct answer
- 🔥 **Streak Bonuses**: Build your streak to earn bonus points (+5 points per streak level)
- 🎮 **Interactive Gameplay**: Type your answer or skip difficult movies
- 📊 **Score Tracking**: Keep track of your score, correct answers, and best streak
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations

## How to Play

1. Open `index.html` in your web browser
2. Click "Start Game" to begin
3. Look at the movie screenshot and type the movie title
4. Press Enter or click "Submit Answer" to check your answer
5. Build streaks for bonus points!
6. Try to get the highest score possible

## Scoring System

- **Correct Answer**: +10 points
- **Streak Bonus**: +5 points per streak (e.g., 3rd correct in a row = 10 base + (3-1)*5 bonus = 20 points)
- **Wrong Answer**: No points, streak resets to 0
- **Skip**: No points, streak resets to 0

## Files

- `index.html` - Main game interface
- `style.css` - Styling and layout
- `script.js` - Game logic and interactivity

## Customization

To add your own movies, edit the `movies` array in `script.js`:

```javascript
{
    title: "Movie Title",
    screenshot: "path/to/screenshot.jpg",
    hints: ["keyword1", "keyword2"]
}
```

## Technologies Used

- HTML5
- CSS3 (with modern features like gradients and flexbox)
- Vanilla JavaScript (ES6+)

Enjoy the game and test your movie knowledge! 🍿