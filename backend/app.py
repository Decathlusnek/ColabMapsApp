
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello from ColabMapsApp Backend!'

@app.route('/api/status')
def status():
    return jsonify({"status": "running"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
