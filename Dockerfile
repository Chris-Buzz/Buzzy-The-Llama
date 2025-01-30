# Start from a base image with Python and other dependencies
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama (replace this with actual installation steps)
RUN curl -sSL https://ollama.com/install.sh | bash

# Copy requirements.txt and install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy your Flask app and other files into the Docker container
COPY . /app/

# Expose the port that your Flask app will run on
EXPOSE 5000


# Start Ollama model (ensure Ollama is running on the expected port)
CMD ["bash", "-c", "ollama start && gunicorn -w 4 -b 0.0.0.0:5000 llama:app"]
docker run --network="host" -p 5000:5000 llama-app

