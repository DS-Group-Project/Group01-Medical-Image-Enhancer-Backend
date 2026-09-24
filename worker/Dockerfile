# 1. Use a lightweight Python base image
FROM python:3.10-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the requirements file first to leverage Docker cache
COPY requirements.txt .

# 4. Install the required Python packages
# Using --no-cache-dir to reduce the final container image size
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the Python worker script into the container
COPY worker.py .

# 6. Define the command to run the worker script when the container starts
CMD ["python", "worker.py"]