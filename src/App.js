import React from 'react';
import './App.css';
import AdjustableTicTacToe from './AdjustableTicTacToe';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Adjustable Tic-Tac-Toe Game</h1>
      </header>
      
      <main>
        <AdjustableTicTacToe />
      </main>
      
      <footer>
        <p>Created by Jonathan Dinh - 2024</p>
      </footer>
    </div>
  );
}

export default App;