# Use an official Python runtime as the base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install the dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application code into the container
COPY . /app/

# Expose the port that Flask will run on
EXPOSE 5000

# Set the environment variable for Flask to run in production mode
ENV FLASK_APP=llama.py
ENV FLASK_ENV=production

# Command to run when the container starts (using gunicorn to serve the app)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "llama:app"]
