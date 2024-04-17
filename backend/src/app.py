from flask import Flask, render_template, request, jsonify
from controllers.gameController import GameController
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__, template_folder='templates')
socketio = SocketIO(app, cors_allowed_origins='http://localhost:3000') #modify this!!
CORS(app)

game_controller = GameController()


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_player', methods=['POST'])
def add_player():
    data = request.get_json()
    gameId = data.get('game_id')
    name = data.get('name')

    try:
        response = game_controller.newPlayer(name, gameId)
        print(game_controller.getPlayers(gameId))
        socketio.emit('players', {'player_names' : game_controller.getPlayers(gameId)}, room = gameId)
        print(response)
        return response
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    

@app.route('/make_move', methods=['POST'])
def make_move():
    data = request.get_json()
    playerId = data.get('player_id')
    gameId = data.get('game_id')
    row = data.get('row')
    col = data.get('col')

    try:
        response = game_controller.makeMove(playerId, row, col, gameId)
        print(response)
        socketio.emit('update_board', {'player_id': playerId, 'row': row, 'col': col}, to=gameId)
        socketio.emit('game_status', response, to=gameId)
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@app.route('/get_board_matrix', methods=['POST'])
def get_board_matrix():
    data = request.get_json()
    gameId = data.get('game_id')
    print(gameId)
    return jsonify(game_controller.getBoard(gameId))

@app.route('/check_game_id', methods=['POST'])
def check_game_id():
    data = request.get_json()
    gameId = data.get('game_id')
    if game_controller.checkGameId(gameId):
        socketio.emit('players', {'player_names' : game_controller.getPlayers(gameId)}, to = gameId)
        return jsonify({'success': True, 'message': f'Valid game id!'})
    return jsonify({'success': False, 'message': f'Invalid game id!'})


@app.route('/reset_board', methods=['GET'])
def reset_matrix():
    try:
        game_controller.resetBoard()
        return jsonify({'success': True, 'message': 'Board reseted!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@app.route('/new_game', methods=['GET'])
def new_game():
    try:
        response = game_controller.newGame()
        return response
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on("join")
def handle_join(data):
    print("joining a room")
    room = data.get("room")
    if room:
        join_room(room)
        print(f"User {request.sid} joined room {room}")
    else:
        print("No room specified in the request.")


if __name__ == '__main__':
    socketio.run(app, debug = True, port=8080, host="0.0.0.0", allow_unsafe_werkzeug=True)
    #app.run(debug=True)