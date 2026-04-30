
# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the backend requirements file into the container
COPY backend/requirements.txt ./backend/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the entire backend directory into the container
COPY backend/ ./backend/

# Expose the port that the Flask app will run on
EXPOSE 5000

# Run the Flask application
CMD ["python", "backend/app.py"]
