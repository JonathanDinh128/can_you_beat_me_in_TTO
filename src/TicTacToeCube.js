import React, { useState, useEffect, useRef } from 'react';
import './TicTacToe3D.css';

const TicTacToeCube = () => {
  // Grid and win settings
  const [gridSize, setGridSize] = useState(3);
  const [winLength, setWinLength] = useState(3);
  
  // Game state
  const [boards, setBoards] = useState({
    front: Array(9).fill(null),
    back: Array(9).fill(null),
    left: Array(9).fill(null),
    right: Array(9).fill(null),
    top: Array(9).fill(null),
    bottom: Array(9).fill(null)
  });
  const [currentFace, setCurrentFace] = useState('front');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [gameHistory, setGameHistory] = useState({ player: 0, ai: 0, tie: 0 });
  const [difficulty, setDifficulty] = useState('medium');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Cube rotation state
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cubeRef = useRef(null);
  
  // Reset board when grid size changes
  useEffect(() => {
    resetGame();
  }, [gridSize]);

  // Setup drag effect for cube rotation
  useEffect(() => {
    // Set up global event listeners for mouse movement and mouse up
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Make rotation speed proportional to the cube size
        const sensitivity = 0.5;
        
        setRotation(prev => ({
          x: prev.x + deltaY * sensitivity,
          y: prev.y - deltaX * sensitivity
        }));
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    // Add event listeners to document
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);
  
  // Get the adjacent cells across cube faces
  const getAdjacentCells = (face, index) => {
    const size = gridSize;
    const row = Math.floor(index / size);
    const col = index % size;
    const adjacentCells = [];
    
    // Define adjacency relationships between faces when cube is unfolded into a flat net
    // This represents how faces would connect in a standard cube net
    const adjacencies = {
      front: {
        top: (r, c) => ({ face: 'top', index: (size - 1) * size + c }),
        bottom: (r, c) => ({ face: 'bottom', index: 0 * size + c }),
        left: (r, c) => ({ face: 'left', index: r * size + (size - 1) }),
        right: (r, c) => ({ face: 'right', index: r * size + 0 })
      },
      back: {
        top: (r, c) => ({ face: 'top', index: 0 * size + (size - 1 - c) }),
        bottom: (r, c) => ({ face: 'bottom', index: (size - 1) * size + (size - 1 - c) }),
        left: (r, c) => ({ face: 'right', index: r * size + (size - 1) }),
        right: (r, c) => ({ face: 'left', index: r * size + 0 })
      },
      left: {
        top: (r, c) => ({ face: 'top', index: (size - 1 - c) * size + 0 }),
        bottom: (r, c) => ({ face: 'bottom', index: c * size + 0 }),
        left: (r, c) => ({ face: 'back', index: r * size + (size - 1) }),
        right: (r, c) => ({ face: 'front', index: r * size + 0 })
      },
      right: {
        top: (r, c) => ({ face: 'top', index: (size - 1 - c) * size + (size - 1) }),
        bottom: (r, c) => ({ face: 'bottom', index: c * size + (size - 1) }),
        left: (r, c) => ({ face: 'front', index: r * size + (size - 1) }),
        right: (r, c) => ({ face: 'back', index: r * size + 0 })
      },
      top: {
        top: (r, c) => ({ face: 'back', index: 0 * size + (size - 1 - c) }),
        bottom: (r, c) => ({ face: 'front', index: 0 * size + c }),
        left: (r, c) => ({ face: 'left', index: 0 * size + c }),
        right: (r, c) => ({ face: 'right', index: 0 * size + c })
      },
      bottom: {
        top: (r, c) => ({ face: 'front', index: (size - 1) * size + c }),
        bottom: (r, c) => ({ face: 'back', index: (size - 1) * size + (size - 1 - c) }),
        left: (r, c) => ({ face: 'left', index: (size - 1) * size + c }),
        right: (r, c) => ({ face: 'right', index: (size - 1) * size + c })
      }
    };
    
    // Check edges of the face to find adjacent cells
    // Top edge
    if (row === 0 && adjacencies[face].hasOwnProperty('top')) {
      const adj = adjacencies[face].top(row, col);
      adjacentCells.push(adj);
    }
    // Bottom edge
    if (row === size - 1 && adjacencies[face].hasOwnProperty('bottom')) {
      const adj = adjacencies[face].bottom(row, col);
      adjacentCells.push(adj);
    }
    // Left edge
    if (col === 0 && adjacencies[face].hasOwnProperty('left')) {
      const adj = adjacencies[face].left(row, col);
      adjacentCells.push(adj);
    }
    // Right edge
    if (col === size - 1 && adjacencies[face].hasOwnProperty('right')) {
      const adj = adjacencies[face].right(row, col);
      adjacentCells.push(adj);
    }
    
    return adjacentCells.filter(adj => adj); // Filter out any undefined adjacencies
  };
  
  // Get the value of a cell from any face
  const getCellValue = (face, index) => {
    return boards[face][index];
  };
  
  // Check if there's a winning line that passes through a cell
  const checkWinningLine = (face, index, player) => {
    const size = gridSize;
    const row = Math.floor(index / size);
    const col = index % size;
    
    // Directions to check: horizontal, vertical, diagonal (↘), diagonal (↙)
    const directions = [
      { dr: 0, dc: 1 },  // horizontal →
      { dr: 1, dc: 0 },  // vertical ↓
      { dr: 1, dc: 1 },  // diagonal ↘
      { dr: 1, dc: -1 }  // diagonal ↙
    ];
    
    // Define all possible valid cross-face connections for a flattened cube
    const validCubeFaceConnections = {
      front: ['top', 'bottom', 'left', 'right'],
      back: ['top', 'bottom', 'left', 'right'],
      left: ['front', 'back', 'top', 'bottom'],
      right: ['front', 'back', 'top', 'bottom'],
      top: ['front', 'back', 'left', 'right'],
      bottom: ['front', 'back', 'left', 'right']
    };
    
    for (const direction of directions) {
      let lineLength = 1; // Start with the current cell
      const winningLine = [{ face, index }];
      
      // Check in both positive and negative directions
      for (const multiplier of [-1, 1]) {
        let currentFace = face;
        let currentRow = row;
        let currentCol = col;
        let currentIndex = index;
        
        // Move in the current direction up to winLength - 1 steps
        for (let step = 1; step < winLength; step++) {
          // Calculate next position
          let nextRow = currentRow + direction.dr * multiplier;
          let nextCol = currentCol + direction.dc * multiplier;
          let nextFace = currentFace;
          let nextIndex = nextRow * size + nextCol;
          
          // Check if we need to cross to an adjacent face
          if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
            // We're going off the edge, find the adjacent cell
            const adjacentCells = getAdjacentCells(currentFace, currentIndex);
            
            // Determine edge direction
            let edgeDirection = '';
            if (currentRow === 0 && direction.dr === -1 * multiplier) edgeDirection = 'top';
            else if (currentRow === size - 1 && direction.dr === 1 * multiplier) edgeDirection = 'bottom';
            else if (currentCol === 0 && direction.dc === -1 * multiplier) edgeDirection = 'left';
            else if (currentCol === size - 1 && direction.dc === 1 * multiplier) edgeDirection = 'right';
            
            // Find a valid adjacent cell
            let foundAdjacentCell = false;
            for (const adjacentCell of adjacentCells) {
              // Make sure the adjacent cell is on a valid connected face
              if (validCubeFaceConnections[currentFace].includes(adjacentCell.face)) {
                // And ensure it's actually adjacent (connects at the edge)
                nextFace = adjacentCell.face;
                nextIndex = adjacentCell.index;
                nextRow = Math.floor(nextIndex / size);
                nextCol = nextIndex % size;
                
                // Verify it's a proper edge-to-edge connection
                const prevCell = winningLine[winningLine.length - 1];
                if (canFacesBeAdjacent(prevCell.face, nextFace)) {
                  foundAdjacentCell = true;
                  break;
                }
              }
            }
            
            if (!foundAdjacentCell) break; // No valid adjacent cell
          }
          
          // Check if the next position is valid after potential adjustments
          if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
            break; // Invalid position
          }
          
          // Check if the cell has the player's mark
          if (getCellValue(nextFace, nextIndex) === player) {
            // Verify this cell is properly adjacent to the previous one
            const prevCell = winningLine[winningLine.length - 1];
            const adjacentCells = getAdjacentCells(prevCell.face, prevCell.index);
            const isProperlyAdjacent = adjacentCells.some(
              adj => adj.face === nextFace && adj.index === nextIndex
            );
            
            if (!isProperlyAdjacent && prevCell.face !== nextFace) {
              break; // Not properly adjacent across faces
            }
            
            lineLength++;
            winningLine.push({ face: nextFace, index: nextIndex });
            
            // Update current position for next iteration
            currentFace = nextFace;
            currentRow = nextRow;
            currentCol = nextCol;
            currentIndex = nextIndex;
          } else {
            break; // Stop if we find a cell that's not the player's
          }
        }
      }
      
      // Check if we have a winning line
      if (lineLength >= winLength) {
        return winningLine;
      }
    }
    
    return null;
  };
  
  // Check for a winner using bands that wrap around the cube
  const checkForBandWinner = () => {
    // For a 3x3 grid (or larger), we have 6 bands that wrap around the cube:
    // 3 horizontal and 3 vertical bands
    
    // Define the bands based on the current grid size
    const getBands = () => {
      const size = gridSize;
      const bands = [];
      
      // Horizontal bands (wrapping around LEFT, FRONT, RIGHT, BACK)
      for (let row = 0; row < size; row++) {
        const horizontalBand = [];
        
        // Add cells from the LEFT face (going right)
        for (let col = 0; col < size; col++) {
          horizontalBand.push({ face: 'left', index: row * size + col });
        }
        
        // Add cells from the FRONT face (going right)
        for (let col = 0; col < size; col++) {
          horizontalBand.push({ face: 'front', index: row * size + col });
        }
        
        // Add cells from the RIGHT face (going right)
        for (let col = 0; col < size; col++) {
          horizontalBand.push({ face: 'right', index: row * size + col });
        }
        
        // Add cells from the BACK face (going right)
        for (let col = 0; col < size; col++) {
          horizontalBand.push({ face: 'back', index: row * size + col });
        }
        
        bands.push(horizontalBand);
      }
      
      // Vertical bands (wrapping around FRONT, TOP, BACK, BOTTOM)
      for (let col = 0; col < size; col++) {
        const verticalBand = [];
        
        // Add cells from the FRONT face (going down)
        for (let row = 0; row < size; row++) {
          verticalBand.push({ face: 'front', index: row * size + col });
        }
        
        // Add cells from the TOP face (specific column)
        for (let topRow = 0; topRow < size; topRow++) {
          verticalBand.push({ face: 'top', index: (size - 1 - topRow) * size + col });
        }
        
        // Add cells from the BACK face (specific column, reversed order)
        for (let backRow = 0; backRow < size; backRow++) {
          const backCol = size - 1 - col; // Reversed column order in back face
          verticalBand.push({ face: 'back', index: backRow * size + backCol });
        }
        
        // Add cells from the BOTTOM face (specific column)
        for (let bottomRow = 0; bottomRow < size; bottomRow++) {
          verticalBand.push({ face: 'bottom', index: bottomRow * size + col });
        }
        
        bands.push(verticalBand);
      }
      
      return bands;
    };
    
    // Get all bands for the current grid size
    const allBands = getBands();
    
    // Check each band for consecutive marks by either player
    for (const band of allBands) {
      // Check for X wins
      const xWinningLine = findConsecutiveInBand(band, 'X', winLength);
      if (xWinningLine) {
        return { winner: 'X', line: xWinningLine };
      }
      
      // Check for O wins
      const oWinningLine = findConsecutiveInBand(band, 'O', winLength);
      if (oWinningLine) {
        return { winner: 'O', line: oWinningLine };
      }
    }
    
    return null;
  };
  
  // Helper to check if two faces can ever be adjacent on a cube
  const canFacesBeAdjacent = (face1, face2) => {
    // A face cannot be adjacent to itself
    if (face1 === face2) return true;
    
    // Define valid adjacencies on a cube
    const validAdjacencies = {
      'front': ['top', 'bottom', 'left', 'right'],
      'back': ['top', 'bottom', 'left', 'right'],
      'top': ['front', 'back', 'left', 'right'],
      'bottom': ['front', 'back', 'left', 'right'],
      'left': ['front', 'back', 'top', 'bottom'],
      'right': ['front', 'back', 'top', 'bottom']
    };
    
    // Check if face2 is in the list of valid adjacencies for face1
    return validAdjacencies[face1].includes(face2);
  };
  
  // Helper function to find consecutive marks in a band
  const findConsecutiveInBand = (band, player, length) => {
    // We must have exactly 'length' consecutive marks to win
    // Make sure we're counting properly
    
    let consecutive = [];
    
    for (let i = 0; i < band.length; i++) {
      const cell = band[i];
      const cellValue = boards[cell.face][cell.index];
      
      if (cellValue === player) {
        consecutive.push(cell);
      } else {
        // Reset consecutive count if we find a non-matching cell
        consecutive = [];
      }
      
      // Check if we have exactly the winning length
      if (consecutive.length === length) {
        return consecutive; // Return exactly 'length' consecutive cells
      }
    }
    
    // Also check for consecutive cells that wrap around the end of the band
    if (consecutive.length > 0 && consecutive.length < length) {
      const startConsecutive = [...consecutive];
      
      // Continue checking from the start of the band
      for (let i = 0; i < band.length && (consecutive.length < length); i++) {
        const cell = band[i];
        const cellValue = boards[cell.face][cell.index];
        
        if (cellValue === player) {
          consecutive.push(cell);
          
          // If we found exactly the winning number of cells, return them
          if (consecutive.length === length) {
            return consecutive;
          }
        } else {
          // No need to check further, since we've hit a non-matching cell
          break;
        }
      }
    }
    
    return null; // No win found
  };
  
  // Helper function to check if two cells are adjacent
  const areCellsAdjacent = (cell1, cell2) => {
    const size = gridSize;
    
    // If cells are on the same face
    if (cell1.face === cell2.face) {
      const row1 = Math.floor(cell1.index / size);
      const col1 = cell1.index % size;
      const row2 = Math.floor(cell2.index / size);
      const col2 = cell2.index % size;
      
      // Check if they are grid-adjacent (not diagonally)
      return (Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1);
    } else {
      // Different faces - check if one is in the adjacent cells of the other
      const adjacentToCel1 = getAdjacentCells(cell1.face, cell1.index);
      return adjacentToCel1.some(adj => adj.face === cell2.face && adj.index === cell2.index);
    }
  };
  
  // Check for a winner across all faces
  const checkAllFacesForWinner = () => {
    // First, check for band-based winners (wrapping around the cube)
    const bandWinner = checkForBandWinner();
    if (bandWinner) {
      return bandWinner;
    }
    
    // Check each face and cell for traditional lines
    for (const face of Object.keys(boards)) {
      for (let i = 0; i < boards[face].length; i++) {
        const cellValue = boards[face][i];
        if (cellValue) {
          const winningLine = checkWinningLine(face, i, cellValue);
          if (winningLine) {
            return { winner: cellValue, line: winningLine };
          }
        }
      }
    }
    
    // Check for tie (all cells filled)
    const allFilled = Object.values(boards).every(board => 
      board.every(cell => cell !== null)
    );
    
    if (allFilled) {
      return { winner: 'tie', line: [] };
    }
    
    return null;
  };

  // AI move based on difficulty
  const getAIMove = () => {
    if (difficulty === 'easy') {
      // For easy difficulty, just make a random move on the current face
      const emptySquares = boards[currentFace]
        .map((square, index) => square === null ? index : null)
        .filter(val => val !== null);
      
      if (emptySquares.length === 0) {
        // If current face is full, find another face with empty squares
        const availableFaces = Object.keys(boards).filter(face => 
          boards[face].some(cell => cell === null)
        );
        
        if (availableFaces.length === 0) return null;
        
        const randomFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
        const emptySquaresOnFace = boards[randomFace]
          .map((square, index) => square === null ? index : null)
          .filter(val => val !== null);
        
        return { face: randomFace, index: emptySquaresOnFace[Math.floor(Math.random() * emptySquaresOnFace.length)] };
      }
      
      return { face: currentFace, index: emptySquares[Math.floor(Math.random() * emptySquares.length)] };
    }
    
     // For medium and hard difficulties
    if (difficulty === 'medium' || difficulty === 'hard') {
      // Check for winning moves or blocking moves
      for (const face of Object.keys(boards)) {
        for (let i = 0; i < boards[face].length; i++) {
          if (boards[face][i] === null) {
            // Test if this would be a winning move for AI
            const tempBoards = JSON.parse(JSON.stringify(boards));
            tempBoards[face][i] = 'O';
            
            // Instead of calling checkWinningLine directly, use a safe check function
            if (wouldWin(face, i, 'O', tempBoards)) {
              return { face, index: i };
            }
            
            // Test if this would block the player
            tempBoards[face][i] = 'X';
            if (wouldWin(face, i, 'X', tempBoards)) {
              return { face, index: i };
            }
          }
        }
      }
      
      // Otherwise make a random move on the current face
      const emptySquares = boards[currentFace]
        .map((square, index) => square === null ? index : null)
        .filter(val => val !== null);
      
      if (emptySquares.length > 0) {
        return { face: currentFace, index: emptySquares[Math.floor(Math.random() * emptySquares.length)] };
      }
      
      // If current face is full, find another face with empty squares
      const availableFaces = Object.keys(boards).filter(face => 
        boards[face].some(cell => cell === null)
      );
      
      if (availableFaces.length === 0) return null;
      
      const randomFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
      const emptySquaresOnFace = boards[randomFace]
        .map((square, index) => square === null ? index : null)
        .filter(val => val !== null);
      
      setCurrentFace(randomFace); // Update current face to where AI will move
      return { face: randomFace, index: emptySquaresOnFace[Math.floor(Math.random() * emptySquaresOnFace.length)] };
    }
  };

  // Helper function to check if a move would result in a win
  const wouldWin = (face, index, player, boardState) => {
    const size = gridSize;
    const row = Math.floor(index / size);
    const col = index % size;
    
    // Check for winning lines in all directions
    const checkLineWin = () => {
      // Directions to check: horizontal, vertical, diagonal (↘), diagonal (↙)
      const directions = [
        { dr: 0, dc: 1 },  // horizontal →
        { dr: 1, dc: 0 },  // vertical ↓
        { dr: 1, dc: 1 },  // diagonal ↘
        { dr: 1, dc: -1 }  // diagonal ↙
      ];
      
      for (const direction of directions) {
        let count = 1; // Start with the current cell
        let cellChain = [{ face, index }]; // Track the cells in sequence
        
        // Check both directions from this point
        for (const multiplier of [-1, 1]) {
          let r = row;
          let c = col;
          let f = face;
          let currIndex = index;
          
          // Look up to winLength - 1 steps away
          for (let step = 0; step < winLength - 1; step++) {
            // Calculate next cell
            let nextR = r + direction.dr * multiplier;
            let nextC = c + direction.dc * multiplier;
            let nextF = f;
            let nextIndex = nextR * size + nextC;
            let foundAdjacentCell = false;
            
            // If we're going out of bounds, try to find adjacent face
            if (nextR < 0 || nextR >= size || nextC < 0 || nextC >= size) {
              // Get adjacent cells
              const adjacentCells = getAdjacentCells(f, currIndex);
              
              // Find a suitable adjacent cell with the player's mark
              for (const adjCell of adjacentCells) {
                if (boardState[adjCell.face][adjCell.index] === player) {
                  // Make sure this cell is truly adjacent to the current cell
                  if (areCellsAdjacent(f, currIndex, adjCell.face, adjCell.index)) {
                    nextF = adjCell.face;
                    nextIndex = adjCell.index;
                    nextR = Math.floor(nextIndex / size);
                    nextC = nextIndex % size;
                    foundAdjacentCell = true;
                    break;
                  }
                }
              }
              
              if (!foundAdjacentCell) {
                break; // No valid adjacent cell
              }
            } else {
              // We're still on the same face - check if the cell has our player's mark
              if (boardState[nextF][nextIndex] !== player) {
                break; // Not our player's mark
              }
              foundAdjacentCell = true; // We found a valid cell on the same face
            }
            
            if (foundAdjacentCell) {
              // Ensure this next cell is truly adjacent to the last cell in our chain
              const lastCell = cellChain[cellChain.length - 1];
              if (areCellsAdjacent(lastCell.face, lastCell.index, nextF, nextIndex)) {
                count++;
                cellChain.push({ face: nextF, index: nextIndex });
                
                // Move to the next cell
                r = nextR;
                c = nextC;
                f = nextF;
                currIndex = nextIndex;
              } else {
                break; // Not truly adjacent
              }
            }
          }
        }
        
        // If we have EXACTLY the winning number in a row, return true
        if (count === winLength) {
          return true;
        }
      }
      
      return false;
    };
    
    // Check for band-based wins - simplified version for AI
    const checkBandWin = () => {
      if (winLength > gridSize) {
        return false; // Band checks only make sense when winLength <= gridSize
      }
      
      // Only check horizontal bands for AI prediction (simplification)
      const rowIndex = row;
      let horizontalCount = 0;
      let lastFace = null;
      let lastIndex = null;
      
      // Check horizontal band that includes our current row
      const faces = ['left', 'front', 'right', 'back'];
      for (const checkFace of faces) {
        for (let checkCol = 0; checkCol < size; checkCol++) {
          const checkIndex = rowIndex * size + checkCol;
          
          if (boardState[checkFace][checkIndex] === player) {
            // First cell or check if adjacent to previous
            if (horizontalCount === 0 || 
                (lastFace === checkFace && Math.abs((lastIndex % size) - checkCol) === 1) ||
                (lastFace !== checkFace && areCellsAdjacent(lastFace, lastIndex, checkFace, checkIndex))) {
              horizontalCount++;
              lastFace = checkFace;
              lastIndex = checkIndex;
              
              if (horizontalCount === winLength) {
                return true;
              }
            } else {
              // Not adjacent, start new sequence
              horizontalCount = 1;
              lastFace = checkFace;
              lastIndex = checkIndex;
            }
          } else {
            horizontalCount = 0;
            lastFace = null;
            lastIndex = null;
          }
        }
      }
      
      return false;
    };
    
    // Check both types of win and return true if either is found
    return checkLineWin() || checkBandWin();
  };

  // Handle player click
  const handleClick = (face, index) => {
    if (winner || !isPlayerTurn || boards[face][index]) return; // Allow play on any face
    
    const newBoards = JSON.parse(JSON.stringify(boards));
    newBoards[face][index] = 'X';
    setBoards(newBoards);
    setCurrentFace(face); // Update current face to where player moved
    setIsPlayerTurn(false);
    
    // Check for winner after player move
    const result = checkAllFacesForWinner();
    if (result) {
      handleGameEnd(result);
      return;
    }
  };

  // Make AI move
  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove();
        
        if (aiMove) {
          const newBoards = JSON.parse(JSON.stringify(boards));
          newBoards[aiMove.face][aiMove.index] = 'O';
          setBoards(newBoards);
          
          // Check for winner after AI move
          const result = checkAllFacesForWinner();
          if (result) {
            handleGameEnd(result);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, 600); // Delay AI move for better UX
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerTurn, boards, currentFace, winner, difficulty, gridSize, winLength]);
  
  // Handle game end
  const handleGameEnd = (result) => {
    setWinner(result);
    
    // Show confetti if player wins
    if (result.winner === 'X') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    
    // Update game history
    setGameHistory(prevHistory => {
      const newHistory = {...prevHistory};
      if (result.winner === 'X') {
        newHistory.player += 1;
      } else if (result.winner === 'O') {
        newHistory.ai += 1;
      } else {
        newHistory.tie += 1;
      }
      return newHistory;
    });
  };

  // Initialize or reset the game boards based on grid size
  const initializeBoards = () => {
    const totalCells = gridSize * gridSize;
    return {
      front: Array(totalCells).fill(null),
      back: Array(totalCells).fill(null),
      left: Array(totalCells).fill(null),
      right: Array(totalCells).fill(null),
      top: Array(totalCells).fill(null),
      bottom: Array(totalCells).fill(null)
    };
  };

  // Reset the game
  const resetGame = () => {
    setBoards(initializeBoards());
    setWinner(null);
    setIsPlayerTurn(true);
    setShowConfetti(false);
  };

  // Handle grid size change
  const handleGridSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setGridSize(newSize);
    
    // Adjust win length if needed
    if (winLength > newSize * 2) { // Max win length is 2 * grid size (across faces)
      setWinLength(newSize);
    }
  };

  // Handle win length change
  const handleWinLengthChange = (e) => {
    const newWinLength = parseInt(e.target.value);
    setWinLength(newWinLength);
  };

  // Handle cube rotation
  const handleMouseDown = (e) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    // Set dragging state and starting position
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Prevent default browser behaviors
    e.preventDefault();
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return; // Only handle single touch
    
    setIsDragging(true);
    setDragStart({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
    
    // Prevent default to avoid scrolling while rotating the cube
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    
    // Make rotation speed proportional to the cube size
    const sensitivity = 0.8; // Higher sensitivity for touch
    
    setRotation(prev => ({
      x: prev.x + deltaY * sensitivity,
      y: prev.y - deltaX * sensitivity
    }));
    
    setDragStart({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
    
    // Prevent default to avoid scrolling while rotating the cube
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    // Prevent default behavior
    e.preventDefault();
  };

  // Reset cube rotation
  const resetRotation = () => {
    setRotation({ x: 0, y: 0 });
  };

  // Set specific face to front
  const setFace = (face) => {
    switch (face) {
      case 'front':
        setRotation({ x: 0, y: 0 });
        break;
      case 'back':
        setRotation({ x: 0, y: 180 });
        break;
      case 'left':
        setRotation({ x: 0, y: -90 });
        break;
      case 'right':
        setRotation({ x: 0, y: 90 });
        break;
      case 'top':
        setRotation({ x: -90, y: 0 });
        break;
      case 'bottom':
        setRotation({ x: 90, y: 0 });
        break;
      default:
        setRotation({ x: 0, y: 0 });
    }
    setCurrentFace(face);
  };

  // Render a square on a face
  const renderSquare = (face, index) => {
    const isWinningSquare = winner && 
                            winner.line && 
                            winner.line.some(cell => cell.face === face && cell.index === index);
    
    // Calculate font size based on grid size
    const fontSize = gridSize <= 3 ? '1.2rem' : 
                    gridSize <= 4 ? '1rem' : 
                    gridSize <= 5 ? '0.8rem' : '0.7rem';
    
    return (
      <div
        key={index}
        className={`cube-cell ${boards[face][index] === 'X' ? 'player-x' : boards[face][index] === 'O' ? 'player-o' : ''} ${isWinningSquare ? 'winning' : ''}`}
        onClick={() => handleClick(face, index)}
        style={{ 
          fontSize: fontSize,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {boards[face][index]}
      </div>
    );
  };

  // Render a cube face
  const renderFace = (face) => {
    return (
      <div className={`cube-face cube-face-${face}`}>
        <div className="face-grid" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          width: '100%',
          height: '100%'
        }}>
          {Array(gridSize * gridSize).fill(null).map((_, index) => renderSquare(face, index))}
        </div>
      </div>
    );
  };

  // Render confetti effect
  const renderConfetti = () => {
    if (!showConfetti) return null;
    
    const confettiElements = [];
    for (let i = 0; i < 100; i++) {
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 3;
      const size = Math.random() * 10 + 5;
      confettiElements.push(
        <div 
          key={i} 
          className="confetti-piece" 
          style={{
            left: `${left}%`,
            animationDelay: `${animationDelay}s`,
            width: `${size}px`,
            height: `${size * 0.5}px`,
            backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
          }}
        />
      );
    }
    
    return <div className="confetti">{confettiElements}</div>;
  };

  // Render game status
  const renderStatus = () => {
    if (winner) {
      if (winner.winner === 'X') {
        return <div className="game-status winner-player">You win! 🎉</div>;
      } else if (winner.winner === 'O') {
        return <div className="game-status winner-ai">AI wins! 🤖</div>;
      } else {
        return <div className="game-status tie">It's a tie! 🤝</div>;
      }
    } else {
      return (
        <div className="game-status turn">
          {isPlayerTurn ? `Your turn (X) - Click on any face` : `AI is thinking... 🤔`}
        </div>
      );
    }
  };

  return (
    <div className="game-container">
      {renderConfetti()}
      
      <h2 className="game-title">3D Tic-Tac-Toe Cube</h2>
      
      <div className="game-options">
        <div className="option-group">
          <label htmlFor="grid-size">Grid Size:</label>
          <select 
            id="grid-size"
            value={gridSize} 
            onChange={handleGridSizeChange}
            disabled={Object.values(boards).some(board => board.some(cell => cell !== null))}
          >
            {[3, 4, 5, 6].map(size => (
              <option key={size} value={size}>{size}x{size}</option>
            ))}
          </select>
        </div>
        
        <div className="option-group">
          <label htmlFor="win-length">Win Length:</label>
          <select 
            id="win-length"
            value={winLength} 
            onChange={handleWinLengthChange}
            disabled={Object.values(boards).some(board => board.some(cell => cell !== null))}
          >
            {Array.from({length: gridSize * 2 - 2}, (_, i) => i + 3).map(len => (
              <option key={len} value={len}>{len} in a row</option>
            ))}
          </select>
        </div>
        
        <div className="option-group">
          <label htmlFor="current-face">Current Face:</label>
          <select 
            id="current-face"
            value={currentFace} 
            onChange={(e) => setFace(e.target.value)}
          >
            <option value="front">Front</option>
            <option value="back">Back</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        
        <div className="option-group">
          <label htmlFor="difficulty">Difficulty:</label>
          <select 
            id="difficulty"
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={Object.values(boards).some(board => board.some(cell => cell !== null))}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      
      {renderStatus()}
      
      <div className="cube-info">
        <p>Get {winLength} in a row to win! A win can be a straight line on any face or a line that wraps around the cube.</p>
        <p>Drag cube to rotate. Click on any face to make your move.</p>
      </div>
      
      <div className="cube-container" 
           style={{ 
             touchAction: 'none', // Disable default touch behaviors
             userSelect: 'none',   // Prevent text selection during dragging
             perspective: '1000px' // Add perspective for 3D effect
           }}>
        <div
          ref={cubeRef}
          className="cube"
          style={{ 
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {renderFace('front')}
          {renderFace('back')}
          {renderFace('right')}
          {renderFace('left')}
          {renderFace('top')}
          {renderFace('bottom')}
        </div>
      </div>
      
      <div className="cube-controls">
        <button onClick={resetRotation}>Reset View</button>
      </div>
      
      <button 
        className="new-game-button"
        onClick={resetGame}
      >
        New Game
      </button>
      
      <div className="game-history">
        <h3>Game History</h3>
        <div className="history-stats">
          <div className="history-item">
            <span className="history-label">You</span>
            <span className="history-count player">{gameHistory.player}</span>
          </div>
          <div className="history-item">
            <span className="history-label">AI</span>
            <span className="history-count ai">{gameHistory.ai}</span>
          </div>
          <div className="history-item">
            <span className="history-label">Ties</span>
            <span className="history-count tie">{gameHistory.tie}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicTacToeCube;