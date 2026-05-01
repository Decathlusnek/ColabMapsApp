
import os
from flask import Flask, jsonify
from google.cloud import secretmanager

app = Flask(__name__)

def get_secret(secret_id, project_id=None):
    """
    Get secret from Google Cloud Secret Manager.
    """
    if not project_id:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "colab-maps-v2")
    
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
    
    try:
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        print(f"Error accessing secret {secret_id}: {e}")
        return None

@app.route('/')
def home():
    return 'Hello from ColabMapsApp Backend!'

@app.route('/api/config')
def get_config():
    api_key = get_secret("MAPS_API_KEY")
    return jsonify({
        "mapsApiKey": api_key
    })

@app.route('/api/status')
def status():
    return jsonify({"status": "running"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
