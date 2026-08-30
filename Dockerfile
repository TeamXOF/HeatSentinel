FROM python:3.11

# Set the working directory to the backend folder
WORKDIR /code/backend

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend /code/backend

# Hugging Face Spaces default port is 7860
EXPOSE 7860

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]