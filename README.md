# Bubble Alphabet Game

An interactive web-based game where players pop bubbles in alphabetical order. Built with Three.js, this game features floating bubbles containing letters that must be popped in sequence from A to F.

## Features

- 🫧 Interactive floating bubbles with letters
- 🔤 Alphabetical sequence gameplay (A → B → C → D → E → F)
- 🎵 Sound effects for:
  - Correct bubble pop
  - Wrong sequence error
  - Game completion
- 📱 Fully responsive design (works on both desktop and mobile)
- 🎮 Touch and click support
- 🌊 Underwater theme with decorative elements

## How to Play

1. Find and pop bubbles in alphabetical order
2. Start with 'A', then 'B', and continue through 'F'
3. If you try to pop a bubble out of sequence, you'll hear an error sound
4. Score increases with each correct pop
5. Complete the sequence to win
6. Click "Play Again" to restart

## Technical Details

### Built With
- HTML5
- JavaScript
- Three.js for 3D rendering
- Custom audio effects

### Files Structure
- `index.html` - Main HTML file
- `game.js` - Game logic and Three.js implementation
- Audio files:
  - `bubble-pop.mp3` - Bubble popping sound
  - `game-end.mp3` - Game completion sound
  - `new-error.mp3` - Wrong sequence sound

## Installation

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/bubble-alphabet.git
```
2. Open `index.html` in a modern web browser

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Game Controls

- Desktop: Click bubbles with mouse
- Mobile: Tap bubbles to pop them

## Development

The game uses Three.js for rendering and includes:
- Orthographic camera for 2D-style rendering
- Sprite-based letter rendering
- Physics-based bubble movement
- Responsive sizing for different screen sizes

## License

This project is private and proprietary. All rights reserved.

## Credits

- Three.js library for 3D rendering
- Sound effects from [source]
