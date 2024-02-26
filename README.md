# Adjustable Tic-Tac-Toe Game

A customizable Tic-Tac-Toe game where you can adjust the grid size, win conditions, and play against an AI opponent with different difficulty levels.

## Features

- **Adjustable Grid Size**: Choose from 3×3 up to 7×7 boards
- **Customizable Win Conditions**: Set how many marks in a row are needed to win
- **Multiple Difficulty Levels**:
  - Easy: AI makes random moves
  - Medium: AI uses basic strategy (can be beaten)
  - Hard: AI uses advanced strategy (very challenging on smaller boards)
- **Game History**: Track wins, losses, and ties
- **Responsive Design**: Works on various screen sizes

## Getting Started

### Prerequisites

- Node.js and npm installed on your system
- A modern web browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JonathanDinh128/Just_play_around.git
   cd tictactoe-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser

## How to Play

1. Select your preferred grid size (3×3 to 7×7)
2. Choose how many marks in a row are needed to win
3. Set the AI difficulty level
4. Click on any square to place your X
5. Try to get the specified number of marks in a row before the AI gets their O's in a row
6. Use the "New Game" button to restart with the current settings

## Technical Details

- Built with React.js
- Uses the minimax algorithm with alpha-beta pruning for the AI opponent
- Implements adaptive difficulty that scales based on board size

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Created by Jonathan Dinh - [GitHub Profile](https://github.com/JonathanDinh128)