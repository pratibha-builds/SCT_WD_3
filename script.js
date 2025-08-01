document.addEventListener('DOMContentLoaded', () => {
    // Game state with localStorage integration
    const gameState = {
        board: Array(9).fill(null),
        currentPlayer: 1,
        gameMode: 'pvp',
        aiDifficulty: 'easy',
        scores: { player1: 0, player2: 0, draws: 0 },
        gameActive: true,
        player1Token: 'X',
        player2Token: 'O',
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        winningCombination: null,
        gameHistory: [],
        lastMove: null,
        animationProgress: 0
    };

    // DOM elements
    const boardElement = document.getElementById('gameBoard');
    const turnIndicator = document.getElementById('turnIndicator');
    const player1Score = document.getElementById('player1Score');
    const player2Score = document.getElementById('player2Score');
    const drawScore = document.getElementById('drawScore');
    const resetBtn = document.getElementById('resetBtn');
    const newGameBtn = document.getElementById('newGameBtn');
    const changePlayersBtn = document.getElementById('changePlayersBtn');
    const themeBtn = document.getElementById('themeBtn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const player1NameInput = document.getElementById('player1Name');
    const player2NameInput = document.getElementById('player2Name');
    const player2InputGroup = document.getElementById('player2InputGroup');
    const startGameBtn = document.getElementById('startGameBtn');
    const playerSetup = document.getElementById('playerSetup');
    const gameControls = document.getElementById('gameControls');
    const historyList = document.getElementById('historyList');

    // Initialize the game
    initGame();

    // Event listeners
    resetBtn.addEventListener('click', resetGame);
    newGameBtn.addEventListener('click', newGame);
    changePlayersBtn.addEventListener('click', showPlayerSetup);
    themeBtn.addEventListener('click', toggleTheme);
    startGameBtn.addEventListener('click', startGame);

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.gameMode = button.dataset.mode;
            updatePlayer2InputVisibility();
            updateDifficultyVisibility();
        });
    });

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.aiDifficulty = button.dataset.difficulty;
        });
    });

    // Functions
    function initGame() {
        loadGameData();
        createBoard();
        updateScores();
        updateTurnIndicator();
        updatePlayer2InputVisibility();
        updateDifficultyVisibility();
    }

    function updatePlayer2InputVisibility() {
        if (gameState.gameMode === 'pvc') {
            player2InputGroup.style.display = 'none';
            player2NameInput.value = 'Computer';
        } else {
            player2InputGroup.style.display = 'block';
            player2NameInput.value = gameState.player2Name === 'Computer' ? '' : gameState.player2Name;
        }
    }

    function loadGameData() {
        const savedData = localStorage.getItem('ticTacToeData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            Object.assign(gameState, parsedData);
            
            // Update UI with loaded data
            player1NameInput.value = gameState.player1Name;
            player2NameInput.value = gameState.player2Name;
            
            // Update token selection
            let radio = document.querySelector(`input[name="player1Token"][value="${gameState.player1Token}"]`);
            if (radio) radio.checked = true;
            
            // Update mode and difficulty
            modeButtons.forEach(btn => btn.classList.remove('active'));
            let modeBtn = document.querySelector(`.mode-btn[data-mode="${gameState.gameMode}"]`);
            if (modeBtn) modeBtn.classList.add('active');
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            let diffBtn = document.querySelector(`.difficulty-btn[data-difficulty="${gameState.aiDifficulty}"]`);
            if (diffBtn) diffBtn.classList.add('active');
            
            updateScores();
            renderGameHistory();
        }
    }

    function saveGameData() {
        localStorage.setItem('ticTacToeData', JSON.stringify({
            scores: gameState.scores,
            player1Name: gameState.player1Name,
            player2Name: gameState.player2Name,
            player1Token: gameState.player1Token,
            player2Token: gameState.player2Token,
            gameHistory: gameState.gameHistory,
            gameMode: gameState.gameMode,
            aiDifficulty: gameState.aiDifficulty
        }));
    }

    function createBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => handleCellClick(i));
            boardElement.appendChild(cell);
        }
    }

    function handleCellClick(index) {
        if (!gameState.gameActive || gameState.board[index] !== null) return;
        
        // Human player's move
        makeMove(index, gameState.currentPlayer);
        
        // Check for game over
        if (checkGameOver()) return;
        
        // AI's move if in PVC mode and it's player 2's turn
        if (gameState.gameMode === 'pvc' && gameState.currentPlayer === 2) {
            setTimeout(() => {
                const aiMove = getAIMove();
                if (aiMove !== null) {
                    makeMove(aiMove, 2);
                    checkGameOver();
                }
            }, 500);
        }
    }

    function makeMove(index, player) {
        gameState.board[index] = player;
        gameState.lastMove = index;
        gameState.animationProgress = 0;
        
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.textContent = player === 1 ? gameState.player1Token : gameState.player2Token;
        cell.dataset.player = player;
        
        // Switch player
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        updateTurnIndicator();
    }

    function getAIMove() {
        const emptyCells = gameState.board
            .map((cell, index) => cell === null ? index : null)
            .filter(val => val !== null);
        
        if (emptyCells.length === 0) return null;

        switch (gameState.aiDifficulty) {
            case 'easy':
                return emptyCells[Math.floor(Math.random() * emptyCells.length)];
            
            case 'medium':
                // Sometimes makes smart moves, sometimes random
                if (Math.random() < 0.7) {
                    // Check for winning move
                    for (const index of emptyCells) {
                        gameState.board[index] = 2;
                        if (checkWinner(2)) {
                            gameState.board[index] = null;
                            return index;
                        }
                        gameState.board[index] = null;
                    }
                    
                    // Check to block player
                    for (const index of emptyCells) {
                        gameState.board[index] = 1;
                        if (checkWinner(1)) {
                            gameState.board[index] = null;
                            return index;
                        }
                        gameState.board[index] = null;
                    }
                }
                return emptyCells[Math.floor(Math.random() * emptyCells.length)];
            
            case 'hard':
                // Minimax algorithm
                return findBestMove();
            
            default:
                return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
    }

    function findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (let i = 0; i < 9; i++) {
            if (gameState.board[i] === null) {
                gameState.board[i] = 2;
                const score = minimax(gameState.board, 0, false);
                gameState.board[i] = null;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }

    function minimax(board, depth, isMaximizing) {
        const scores = {
            1: -10,
            2: 10,
            draw: 0
        };
        
        const winner = checkWinnerFromBoard(board);
        if (winner !== null) {
            return scores[winner];
        }
        
        if (isBoardFullFromBoard(board)) {
            return scores.draw;
        }
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 2;
                    const score = minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 1;
                    const score = minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function checkGameOver() {
        const winner = checkWinner(gameState.currentPlayer === 1 ? 2 : 1);
        if (winner) {
            gameState.gameActive = false;
            highlightWinningCells();
            
            // Record game history
            const gameResult = {
                date: new Date().toLocaleString(),
                players: [gameState.player1Name, gameState.player2Name],
                winner: winner === 1 ? gameState.player1Name : gameState.player2Name,
                score: `${gameState.scores.player1 + (winner === 1 ? 1 : 0)}-${gameState.scores.player2 + (winner === 2 ? 1 : 0)}-${gameState.scores.draws}`,
                tokens: [gameState.player1Token, gameState.player2Token]
            };
            
            if (winner === 1) {
                gameState.scores.player1++;
                gameResult.winner = gameState.player1Name;
                triggerConfetti();
            } else if (winner === 2) {
                gameState.scores.player2++;
                gameResult.winner = gameState.player2Name;
            }
            
            gameState.gameHistory.push(gameResult);
            if (gameState.gameHistory.length > 10) {
                gameState.gameHistory.shift();
            }
            
            updateScores();
            updateTurnIndicator();
            saveGameData();
            renderGameHistory();
            return true;
        }
        
        if (isBoardFull()) {
            gameState.gameActive = false;
            gameState.scores.draws++;
            
            // Record draw in history
            gameState.gameHistory.push({
                date: new Date().toLocaleString(),
                players: [gameState.player1Name, gameState.player2Name],
                winner: 'draw',
                score: `${gameState.scores.player1}-${gameState.scores.player2}-${gameState.scores.draws + 1}`,
                tokens: [gameState.player1Token, gameState.player2Token]
            });
            
            if (gameState.gameHistory.length > 10) {
                gameState.gameHistory.shift();
            }
            
            updateScores();
            updateTurnIndicator();
            saveGameData();
            renderGameHistory();
            return true;
        }
        
        return false;
    }

    function checkWinner(player) {
        return checkWinnerFromBoard(gameState.board) === player;
    }

    function checkWinnerFromBoard(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
                gameState.winningCombination = pattern;
                return board[a];
            }
        }
        
        return null;
    }

    function highlightWinningCells() {
        if (!gameState.winningCombination) return;
        
        gameState.winningCombination.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            cell.classList.add('winning-cell');
        });
    }

    function isBoardFull() {
        return isBoardFullFromBoard(gameState.board);
    }

    function isBoardFullFromBoard(board) {
        return board.every(cell => cell !== null);
    }

    function resetGame() {
        gameState.board = Array(9).fill(null);
        gameState.currentPlayer = 1;
        gameState.gameActive = true;
        gameState.winningCombination = null;
        gameState.lastMove = null;
        gameState.animationProgress = 0;
        
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.removeAttribute('data-player');
            cell.classList.remove('winning-cell');
        });
        
        updateTurnIndicator();
    }

    function newGame() {
        gameState.scores = { player1: 0, player2: 0, draws: 0 };
        updateScores();
        resetGame();
        saveGameData();
    }

    function showPlayerSetup() {
        playerSetup.style.display = 'block';
        gameControls.style.display = 'none';
    }

    function startGame() {
        gameState.player1Name = player1NameInput.value || 'Player 1';
        gameState.player2Name = gameState.gameMode === 'pvc' ? 'Computer' : 
                              (player2NameInput.value || 'Player 2');
        
        const selectedToken = document.querySelector('input[name="player1Token"]:checked').value;
        gameState.player1Token = selectedToken;
        gameState.player2Token = selectedToken === 'X' ? 'O' : 'X';
        
        // Show game controls and hide setup
        playerSetup.style.display = 'none';
        gameControls.style.display = 'block';
        
        resetGame();
        saveGameData();
    }

    function updateScores() {
        player1Score.querySelector('.score-value').textContent = gameState.scores.player1;
        player2Score.querySelector('.score-value').textContent = gameState.scores.player2;
        drawScore.querySelector('.score-value').textContent = gameState.scores.draws;
        
        player1Score.querySelector('.score-label').textContent = gameState.player1Name;
        player2Score.querySelector('.score-label').textContent = gameState.player2Name;
    }

    function updateTurnIndicator() {
        if (!gameState.gameActive) {
            if (gameState.winningCombination) {
                const winner = gameState.board[gameState.winningCombination[0]];
                turnIndicator.querySelector('span').textContent = winner === 1 ? 
                    `${gameState.player1Name} Wins!` : 
                    `${gameState.player2Name} Wins!`;
                turnIndicator.style.color = winner === 1 ? 
                    'var(--primary)' : 'var(--secondary)';
            } else {
                turnIndicator.querySelector('span').textContent = "It's a Draw!";
                turnIndicator.style.color = 'var(--text)';
            }
        } else {
            turnIndicator.querySelector('span').textContent = gameState.currentPlayer === 1 ? 
                `${gameState.player1Name}'s Turn (${gameState.player1Token})` : 
                `${gameState.player2Name}'s Turn (${gameState.player2Token})`;
            turnIndicator.style.color = gameState.currentPlayer === 1 ? 
                'var(--primary)' : 'var(--secondary)';
        }
    }

    function updateDifficultyVisibility() {
        const difficultySection = document.getElementById('difficultySection');
        difficultySection.style.display = gameState.gameMode === 'pvc' ? 'block' : 'none';
    }

    function renderGameHistory() {
        historyList.innerHTML = '';
        gameState.gameHistory.slice().reverse().forEach((game, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const gameNumber = document.createElement('span');
            gameNumber.textContent = `Game ${gameState.gameHistory.length - index}`;
            
            const players = document.createElement('span');
            players.textContent = `${game.players[0]} (${game.tokens[0]}) vs ${game.players[1]} (${game.tokens[1]})`;
            
            const winner = document.createElement('span');
            winner.className = 'history-winner';
            
            if (game.winner === 'draw') {
                winner.textContent = 'Draw';
            } else {
                winner.textContent = `${game.winner} won`;
                winner.style.color = game.winner === game.players[0] ? 
                    'var(--primary)' : 'var(--secondary)';
            }
            
            historyItem.appendChild(gameNumber);
            historyItem.appendChild(players);
            historyItem.appendChild(winner);
            historyList.appendChild(historyItem);
        });
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            themeBtn.innerHTML = '<span class="btn-icon">🌙</span><span class="btn-text">Dark Mode</span>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = '<span class="btn-icon">☀️</span><span class="btn-text">Light Mode</span>';
        }
    }

    function triggerConfetti() {
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#6B5B95', '#FF9F1C']
            });
        }
    }
});