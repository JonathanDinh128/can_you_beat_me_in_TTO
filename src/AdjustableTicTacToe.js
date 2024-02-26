import React, { useState, useEffect } from 'react';

const AdjustableTicTacToe = () => {
  const [gridSize, setGridSize] = useState(3);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [gameHistory, setGameHistory] = useState({ player: 0, ai: 0, tie: 0 });
  const [winLength, setWinLength] = useState(3);

  // Initialize board when grid size changes
  useEffect(() => {
    resetGame();
  }, [gridSize, winLength]);

  // Calculate winner based on current grid size and win length
  const calculateWinner = (squares) => {
    const size = gridSize;
    const totalCells = size * size;
    
    // Check rows
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - winLength; col++) {
        const startIndex = row * size + col;
        const line = Array(winLength).fill().map((_, i) => startIndex + i);
        
        if (checkLine(squares, line)) {
          return { winner: squares[startIndex], line };
        }
      }
    }
    
    // Check columns
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - winLength; row++) {
        const startIndex = row * size + col;
        const line = Array(winLength).fill().map((_, i) => startIndex + (i * size));
        
        if (checkLine(squares, line)) {
          return { winner: squares[startIndex], line };
        }
      }
    }
    
    // Check diagonals (top-left to bottom-right)
    for (let row = 0; row <= size - winLength; row++) {
      for (let col = 0; col <= size - winLength; col++) {
        const startIndex = row * size + col;
        const line = Array(winLength).fill().map((_, i) => startIndex + (i * size) + i);
        
        if (checkLine(squares, line)) {
          return { winner: squares[startIndex], line };
        }
      }
    }
    
    // Check diagonals (top-right to bottom-left)
    for (let row = 0; row <= size - winLength; row++) {
      for (let col = winLength - 1; col < size; col++) {
        const startIndex = row * size + col;
        const line = Array(winLength).fill().map((_, i) => startIndex + (i * size) - i);
        
        if (checkLine(squares, line)) {
          return { winner: squares[startIndex], line };
        }
      }
    }
    
    // Check for tie
    if (squares.every(square => square !== null)) {
      return { winner: 'tie', line: [] };
    }
    
    return null;
  };

  // Helper function to check if all cells in a line have the same value
  const checkLine = (squares, line) => {
    const firstValue = squares[line[0]];
    if (!firstValue) return false;
    return line.every(index => squares[index] === firstValue);
  };

  // AI move based on difficulty
  const getAIMove = (currentBoard) => {
    // Make a copy of the board
    const boardCopy = [...currentBoard];
    
    // If playing on easy, make a random move
    if (difficulty === 'easy') {
      const emptySquares = boardCopy.map((square, index) => square === null ? index : null).filter(val => val !== null);
      if (emptySquares.length === 0) return null;
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }
    
    // For medium difficulty, use a combination of strategy and randomness
    if (difficulty === 'medium') {
      // First check if AI can win in the next move
      for (let i = 0; i < boardCopy.length; i++) {
        if (boardCopy[i] === null) {
          boardCopy[i] = 'O';
          if (calculateWinner(boardCopy)?.winner === 'O') {
            boardCopy[i] = null;
            return i;
          }
          boardCopy[i] = null;
        }
      }
      
      // Then check if player can win in the next move and block
      for (let i = 0; i < boardCopy.length; i++) {
        if (boardCopy[i] === null) {
          boardCopy[i] = 'X';
          if (calculateWinner(boardCopy)?.winner === 'X') {
            boardCopy[i] = null;
            return i;
          }
          boardCopy[i] = null;
        }
      }
      
      // Choose center if it's free (for 3x3 grid)
      if (gridSize === 3 && boardCopy[4] === null) {
        return 4;
      }
      
      // For larger boards, restrict lookahead to make it beatable
      if (gridSize > 3) {
        // Make a semi-intelligent move by prioritizing cells that could form winning combinations
        const moveScores = Array(boardCopy.length).fill(0);
        
        // Score each empty cell based on potential
        for (let i = 0; i < boardCopy.length; i++) {
          if (boardCopy[i] === null) {
            // Check how many potential winning lines this cell is part of
            moveScores[i] = evaluateMove(boardCopy, i);
          }
        }
        
        // Find cells with maximum score
        const maxScore = Math.max(...moveScores);
        const bestMoves = moveScores
          .map((score, index) => score === maxScore && boardCopy[index] === null ? index : null)
          .filter(val => val !== null);
        
        if (bestMoves.length > 0) {
          // Randomly choose among the best moves
          return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
      }
      
      // Otherwise make a random move
      const emptySquares = boardCopy.map((square, index) => square === null ? index : null).filter(val => val !== null);
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }
    
    // For hard difficulty, use minimax on smaller boards
    if (gridSize <= 3) {
      return findBestMove(boardCopy);
    } else {
      // For larger boards, just use the same approach as medium but with more lookahead
      // First check if AI can win in the next move
      for (let i = 0; i < boardCopy.length; i++) {
        if (boardCopy[i] === null) {
          boardCopy[i] = 'O';
          if (calculateWinner(boardCopy)?.winner === 'O') {
            boardCopy[i] = null;
            return i;
          }
          boardCopy[i] = null;
        }
      }
      
      // Then check if player can win in the next move and block
      for (let i = 0; i < boardCopy.length; i++) {
        if (boardCopy[i] === null) {
          boardCopy[i] = 'X';
          if (calculateWinner(boardCopy)?.winner === 'X') {
            boardCopy[i] = null;
            return i;
          }
          boardCopy[i] = null;
        }
      }
      
      // Make a strategic move based on cell evaluation
      const moveScores = Array(boardCopy.length).fill(0);
      
      // Score each empty cell based on potential
      for (let i = 0; i < boardCopy.length; i++) {
        if (boardCopy[i] === null) {
          moveScores[i] = evaluateMove(boardCopy, i);
        }
      }
      
      // Find cell with maximum score
      const maxScore = Math.max(...moveScores);
      const bestMoves = moveScores
        .map((score, index) => score === maxScore && boardCopy[index] === null ? index : null)
        .filter(val => val !== null);
      
      if (bestMoves.length > 0) {
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
      }
      
      // If all else fails, make a random move
      const emptySquares = boardCopy.map((square, index) => square === null ? index : null).filter(val => val !== null);
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }
  };

  // Evaluate a potential move
  const evaluateMove = (board, index) => {
    let score = 0;
    const size = gridSize;
    const row = Math.floor(index / size);
    const col = index % size;
    
    // Check row potential
    for (let i = Math.max(0, col - winLength + 1); i <= Math.min(col, size - winLength); i++) {
      let segment = [];
      for (let j = 0; j < winLength; j++) {
        segment.push(board[row * size + (i + j)]);
      }
      const aiCount = segment.filter(cell => cell === 'O').length;
      const playerCount = segment.filter(cell => cell === 'X').length;
      
      if (playerCount === 0) score += Math.pow(2, aiCount);
      if (aiCount === 0) score += Math.pow(2, playerCount);
    }
    
    // Check column potential
    for (let i = Math.max(0, row - winLength + 1); i <= Math.min(row, size - winLength); i++) {
      let segment = [];
      for (let j = 0; j < winLength; j++) {
        segment.push(board[(i + j) * size + col]);
      }
      const aiCount = segment.filter(cell => cell === 'O').length;
      const playerCount = segment.filter(cell => cell === 'X').length;
      
      if (playerCount === 0) score += Math.pow(2, aiCount);
      if (aiCount === 0) score += Math.pow(2, playerCount);
    }
    
    // Check diagonal potentials if the cell is on a diagonal
    // Diagonal from top-left to bottom-right
    if (Math.abs(row - col) < winLength) {
      for (let i = -Math.min(row, col); i <= Math.min(size - 1 - row, size - 1 - col) - winLength + 1; i++) {
        if (i + winLength - 1 <= Math.min(size - 1 - row, size - 1 - col) && i >= -Math.min(row, col)) {
          let segment = [];
          for (let j = 0; j < winLength; j++) {
            segment.push(board[(row + i + j) * size + (col + i + j)]);
          }
          const aiCount = segment.filter(cell => cell === 'O').length;
          const playerCount = segment.filter(cell => cell === 'X').length;
          
          if (playerCount === 0) score += Math.pow(2, aiCount);
          if (aiCount === 0) score += Math.pow(2, playerCount);
        }
      }
    }
    
    // Diagonal from top-right to bottom-left
    if (row + col < size + winLength - 1 && row + col >= winLength - 1) {
      for (let i = -Math.min(row, size - 1 - col); i <= Math.min(size - 1 - row, col) - winLength + 1; i++) {
        if (i + winLength - 1 <= Math.min(size - 1 - row, col) && i >= -Math.min(row, size - 1 - col)) {
          let segment = [];
          for (let j = 0; j < winLength; j++) {
            segment.push(board[(row + i + j) * size + (col - i - j)]);
          }
          const aiCount = segment.filter(cell => cell === 'O').length;
          const playerCount = segment.filter(cell => cell === 'X').length;
          
          if (playerCount === 0) score += Math.pow(2, aiCount);
          if (aiCount === 0) score += Math.pow(2, playerCount);
        }
      }
    }
    
    return score;
  };

  // Minimax algorithm for AI (for smaller boards)
  const minimax = (board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
    const result = calculateWinner(board);
    
    // Terminal states
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      if (result.winner === 'tie') return 0;
    }
    
    // Depth limit reached
    if (depth === 0) return 0;
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          const score = minimax(board, depth - 1, false, alpha, beta);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
          
          // Alpha-beta pruning
          alpha = Math.max(alpha, bestScore);
          if (beta <= alpha) break;
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          const score = minimax(board, depth - 1, true, alpha, beta);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
          
          // Alpha-beta pruning
          beta = Math.min(beta, bestScore);
          if (beta <= alpha) break;
        }
      }
      return bestScore;
    }
  };

  // Find the best move using minimax
  const findBestMove = (board) => {
    let bestScore = -Infinity;
    let bestMove = null;
    const maxDepth = 5; // Limit depth for larger boards
    
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, maxDepth, false);
        board[i] = null;
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    
    return bestMove;
  };

  // Handle player click
  const handleClick = (index) => {
    if (winner || !isPlayerTurn || board[index]) return;
    
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    setIsPlayerTurn(false);
    
    // Check for winner after player move
    const result = calculateWinner(newBoard);
    if (result) {
      handleGameEnd(result.winner);
      return;
    }
  };

  // Make AI move
  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const aiMoveIndex = getAIMove(board);
        
        if (aiMoveIndex !== null) {
          const newBoard = [...board];
          newBoard[aiMoveIndex] = 'O';
          setBoard(newBoard);
          setIsXNext(true);
          
          // Check for winner after AI move
          const result = calculateWinner(newBoard);
          if (result) {
            handleGameEnd(result.winner);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, 600); // Delay AI move for better UX
      
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, winner]);

  // Handle game end
  const handleGameEnd = (gameWinner) => {
    setWinner(gameWinner);
    
    // Update game history
    setGameHistory(prevHistory => {
      const newHistory = {...prevHistory};
      if (gameWinner === 'X') {
        newHistory.player += 1;
      } else if (gameWinner === 'O') {
        newHistory.ai += 1;
      } else {
        newHistory.tie += 1;
      }
      return newHistory;
    });
  };

  // Reset the game
  const resetGame = () => {
    const totalCells = gridSize * gridSize;
    setBoard(Array(totalCells).fill(null));
    setIsXNext(true);
    setWinner(null);
    setIsPlayerTurn(true);
  };

  // Handle grid size change
  const handleGridSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setGridSize(newSize);
    
    // Adjust win length if needed
    if (winLength > newSize) {
      setWinLength(newSize);
    }
  };

  // Handle win length change
  const handleWinLengthChange = (e) => {
    const newWinLength = parseInt(e.target.value);
    setWinLength(newWinLength);
  };

  // Render a square
  const renderSquare = (index) => {
    const isWinningSquare = winner && winner.line && winner.line.includes(index);
    
    return (
      <button 
        className={`square ${board[index] === 'X' ? 'player-x' : 'player-o'} ${isWinningSquare ? 'winning' : ''}`}
        style={{
          width: `${70 / gridSize}px`,
          height: `${70 / gridSize}px`,
          minWidth: '30px',
          minHeight: '30px',
          fontSize: gridSize > 4 ? '14px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ccc',
          backgroundColor: isWinningSquare ? '#ffd700' : 'white',
          color: board[index] === 'X' ? '#3498db' : '#e74c3c',
          fontWeight: 'bold'
        }}
        onClick={() => handleClick(index)}
        disabled={winner || board[index] !== null || !isPlayerTurn}
      >
        {board[index]}
      </button>
    );
  };

  // Render grid
  const renderGrid = () => {
    const rows = [];
    
    for (let row = 0; row < gridSize; row++) {
      const cells = [];
      for (let col = 0; col < gridSize; col++) {
        const index = row * gridSize + col;
        cells.push(
          <div key={index} style={{ padding: 0 }}>
            {renderSquare(index)}
          </div>
        );
      }
      
      rows.push(
        <div key={row} style={{ display: 'flex' }}>
          {cells}
        </div>
      );
    }
    
    return (
      <div style={{ display: 'inline-block', border: '1px solid #ccc' }}>
        {rows}
      </div>
    );
  };

  // Render game status
  const renderStatus = () => {
    if (winner === 'X') {
      return <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.25rem' }}>You win!</div>;
    } else if (winner === 'O') {
      return <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.25rem' }}>AI wins!</div>;
    } else if (winner === 'tie') {
      return <div style={{ color: '#7f8c8d', fontWeight: 'bold', fontSize: '1.25rem' }}>It's a tie!</div>;
    } else {
      return <div style={{ color: '#3498db', fontWeight: 'bold' }}>{isPlayerTurn ? "Your turn (X)" : "AI is thinking... (O)"}</div>;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '1rem',
      maxWidth: '500px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Adjustable Tic-Tac-Toe vs AI</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem',
        marginBottom: '1rem',
        width: '100%'
      }}>
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>Grid Size:</label>
          <select 
            value={gridSize} 
            onChange={handleGridSizeChange}
            style={{ padding: '0.25rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={board.some(square => square !== null)}
          >
            {[3, 4, 5, 6, 7].map(size => (
              <option key={size} value={size}>{size}x{size}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>Win Length:</label>
          <select 
            value={winLength} 
            onChange={handleWinLengthChange}
            style={{ padding: '0.25rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={board.some(square => square !== null)}
          >
            {Array.from({length: gridSize}, (_, i) => i + 3).map(len => {
              if (len <= gridSize) {
                return <option key={len} value={len}>{len} in a row</option>;
              }
              return null;
            })}
          </select>
        </div>
        
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>Difficulty:</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={board.some(square => square !== null)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        {renderStatus()}
      </div>
      
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {renderGrid()}
      </div>
      
      <button 
        onClick={resetGame}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '1rem',
          fontWeight: '500'
        }}
      >
        New Game
      </button>
      
      <div style={{ 
        fontSize: '0.875rem', 
        backgroundColor: '#f1f1f1', 
        padding: '0.75rem', 
        borderRadius: '4px', 
        width: '100%' 
      }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>Game History</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div>You: {gameHistory.player}</div>
          <div>AI: {gameHistory.ai}</div>
          <div>Ties: {gameHistory.tie}</div>
        </div>
      </div>
    </div>
  );
};

export default AdjustableTicTacToe;