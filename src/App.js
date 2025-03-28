import React, { useState } from 'react';
import './App.css';
import AdjustableTicTacToe from './AdjustableTicTacToe';
import TicTacToeCube from './TicTacToeCube';
import './TicTacToe3D.css';

function App() {
  const [gameMode, setGameMode] = useState('2d'); // '2d' or '3d'
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Tic-Tac-Toe Challenge</h1>
        <p>Can you beat the AI?</p>
        <div className="mode-toggle">
          <button 
            className={gameMode === '2d' ? 'active' : ''} 
            onClick={() => setGameMode('2d')}
          >
            2D Mode
          </button>
          <button 
            className={gameMode === '3d' ? 'active' : ''} 
            onClick={() => setGameMode('3d')}
          >
            3D Cube Mode
          </button>
        </div>
      </header>
      
      <main>
        {gameMode === '2d' ? (
          <AdjustableTicTacToe />
        ) : (
          <TicTacToeCube />
        )}
      </main>
      
      <footer>
        <p>Created by Jonathan Dinh - 2024</p>
        <p>Select 3D Cube Mode to play on all 6 faces of a cube!</p>
      </footer>
    </div>
  );
}

export default App;