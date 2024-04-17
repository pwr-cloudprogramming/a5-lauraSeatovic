document.addEventListener('DOMContentLoaded', function() {
    const boardElement = document.getElementById('board');
    const addButton = document.getElementById('add-player-btn');
    const resetButton = document.getElementById('reset-game-btn');
    const newGameButton = document.getElementById('new-game-btn');
    const joinGameButton = document.getElementById('join-game-btn');
    const baseUrl = 'http://localhost:8080';
    let socket = null;

    //socket.on('connect', function() {
      //  console.log('Connected to server');
    //});

    let playerIds = [];
    let currentPlayerIndex = 0;

    let gameOver = false;


    async function addPlayer() {
        const name = prompt('Enter player name:');
        if (name) {
            const url = `${baseUrl}/add_player`;
            const data = {
                playerId: '',  // Let backend generate player ID
                symbol: '',  // Let backend assign symbol (X or O)
                name: name,
                game_id: localStorage.getItem('gameId')
            };
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error('Failed to add player');
                }
                const responseData = await response.json();
                if(responseData.success){
                    localStorage.setItem('playerId', responseData.player_id);
                    playerIds.push(responseData.player_id);
                    console.log('Player added successfully:', responseData);
                    console.log('Player IDs:', playerIds);

                    const player = document.getElementById('player');
                    player.textContent = "Player:" + name;
                    player.style.display = 'block'
                }else{
                    console.log('Error:', responseData);
                }
            } catch (error) {
                console.error('Error adding player:', error);
            }
        }
    }

    async function startNewGame() {
        gameOver = false;
        const url = `${baseUrl}/new_game`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to start new game');
            }
            const responseData = await response.json();
            if(responseData.success){
                console.log('Started new game:', responseData);
                console.log(responseData.game_id);
                localStorage.setItem('gameId', responseData.game_id);

                const gameId = localStorage.getItem('gameId');
                const gameIdContainer = document.getElementById('gameIdContainer');
                gameIdContainer.textContent = `Game ID: ${gameId}`;
                
                socket = io(baseUrl);

                socket.on('connect', () => {
                    console.log('Before emitting join event');
                    socket.emit("join", { room: gameId });
                    console.log('After emitting join event');


                    socket.on('update_board', function(data) {
                        console.log('Received update from server:', data);
                        renderBoard()
                        // Update the board based on the data received
                    });
                
                    socket.on('players', function(data) {
                        console.log('Received update from server:', data);
                        showPlayers(data.player_names)
                    });
                
                    socket.on('game_status', function(data) {
                        console.log('Received update from server:', data);
                        showMessage(data.message)
                        // Update the board based on the data received
                    });
                
                })
                

                renderBoard()
            }else{
                console.log('Error:', responseData);
            }
        } catch (error) {
            console.error('Error starting new game:', error);
        }
    }
    
    
    // Function to fetch board matrix from backend
    async function fetchBoardMatrix() {
        const url = `${baseUrl}/get_board_matrix`;
        const data = {
            game_id: localStorage.getItem('gameId')
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Failed to fetch board matrix');
            }
            return await response.json();  // Convert response to JSON format
        } catch (error) {
            console.error('Error fetching board matrix:', error);
        }
    }

    async function resetBoard() {
        try {
            gameOver = false;
            const response = await fetch(`${baseUrl}/reset_board`);// Fetch data from backend endpoint
            if (!response.ok) {
                throw new Error('Failed to reset board matrix');
            }
            showMessage("")
            renderBoard()
            return await response.json();  // Convert response to JSON format
        } catch (error) {
            console.error('Error resetin board matrix:', error);
        }
    }
    // Function to check for a winner
    function checkWinner() {
        // Logic to check for a winner (not implemented in this example)
        // You can implement your own logic to check for a winning condition
    }

    // Function to handle cell click event
    async function handleCellClick(row, col) {
        const playerId = playerIds[currentPlayerIndex];
        const url = `${baseUrl}/make_move`;
        console.log(playerId)
        console.log(playerIds)

        if (gameOver == true) {
            console.log('Game is over. Cannot make a move.');
            return;
        }

        const data = {
            player_id: localStorage.getItem('playerId'), // Assuming currentPlayer is the player ID
            row: row,
            col: col,
            game_id: localStorage.getItem('gameId')
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Failed to make move');
            }
            const responseData = await response.json();
            console.log('Move made successfully:', responseData);
            const status = responseData.status;
            if (status === 0) {
                console.log('Game over! Winner is ' + responseData.winner);
                gameOver = true;
                //showMessage('Game over! Winner is ' + responseData.winner);
            } else if (status === 1) {
                gameOver = true;
                //showMessage('Game over! No winner!');
                console.log('Game over! No winner.');
            } else if (status === 2) {
                console.log('Game still in progress.');
                // Continue the game
            } else {
                console.error('Invalid status received:', status);
            }
            renderBoard();
            currentPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
        } catch (error) {
            console.error('Error making move:', error);
        }
    }

    async function joinGame() {
        gameOver = false
        const gameId = prompt('Enter game id:');
        const url = `${baseUrl}/check_game_id`;
        const data = {
            game_id: gameId
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Failed to join');
            }
            const responseData = await response.json();
            if(responseData.success){
                localStorage.setItem('gameId', gameId );
                console.log("Joined new game", responseData)
                
                socket = io(baseUrl);

                socket.on('connect', () => {
                    socket.emit("join", { room: gameId });

                    socket.on('update_board', function(data) {
                        console.log('Received update from server:', data);
                        renderBoard()
                        // Update the board based on the data received
                    });
                
                    socket.on('players', function(data) {
                        console.log('Received update from server:', data);
                        showPlayers(data.player_names)
                    });
                
                    socket.on('game_status', function(data) {
                        console.log('Received update from server:', data);
                        showMessage(data.message)
                        // Update the board based on the data received
                    });
                
                
                })

                const gameIdContainer = document.getElementById('gameIdContainer');
                gameIdContainer.textContent = `Game ID: ${gameId}`;

                renderBoard()
        }else{
            console.log("Error joining new game", responseData)
        }
        } catch (error) {
            console.error('Error joining new game:', error);
        }
    }


    
    function showMessage(message) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.style.display = 'block';
    }

    function showPlayers(players) {
        const playersElement = document.getElementById('players');
        playersElement.textContent = "Players: " + players;
        playersElement.style.display = 'block';
    }

    addButton.addEventListener('click', addPlayer);
    //resetButton.addEventListener('click', resetBoard);
    newGameButton.addEventListener('click', startNewGame);
    joinGameButton.addEventListener('click', joinGame);

    // Function to render the Tic Tac Toe board
    async function renderBoard() {
        const boardMatrix = await fetchBoardMatrix();  // Fetch board matrix data
        if (!boardMatrix) {
            console.error('Board matrix data is empty');
            return;
        }
        boardElement.innerHTML = ''; // Clear previous content
        boardMatrix.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.textContent = cell;
                cellElement.addEventListener('click', () => handleCellClick(rowIndex, colIndex));
                boardElement.appendChild(cellElement);
            });
        });
    }
    /*

    socket.on('update_board', function(data) {
        console.log('Received update from server:', data);
        renderBoard()
        // Update the board based on the data received
    });

    socket.on('players', function(data) {
        console.log('Received update from server:', data);
        showPlayers(data.player_names)
    });

    socket.on('game_status', function(data) {
        console.log('Received update from server:', data);
        showMessage(data.message)
        // Update the board based on the data received
    });*/
});
