# Use an official Python runtime as the base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install Ollama (make sure this command is valid for your system)
RUN apt-get update && apt-get install -y ollama  # Modify this based on Ollama installation steps

# Copy requirements.txt and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . /app/

# Expose the port that Flask will run on
EXPOSE 5000

# Set environment variables for Flask
ENV FLASK_APP=llama.py
ENV FLASK_ENV=production

# Command to run when the container starts
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "llama:app"]
