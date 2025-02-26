from flask import Flask, render_template, session
from flask_socketio import SocketIO, emit, send

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('speech_to_text')
def handle_speech(data):
    print('Received message:', data)
    # Send the message back to the sender
    send(data, namespace='/')
    # Broadcast the message to all other clients
    emit('speech_update', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', debug=True)