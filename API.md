# Nirvyatha: API Documentation 🔌

This document details the backend services and integration logic for the Nirvyatha AI.

---

## 🏗 Architecture Overview

Nirvyatha uses a **Proxy Server Architecture** to safely connect the frontend to the AI model.

- **Frontend**: Calls the local backend server.
- **Backend (Node.js/Express)**: 
    1. Receives the user text.
    2. Attaches the secure Hugging Face Token (hidden from the client).
    3. Calls the Hugging Face Inference API.
    4. Filters and maps the AI response for the frontend.
- **AI Model**: `j-hartmann/emotion-english-distilroberta-base` (DistilRoBERTa for emotion classification).

---

## 📡 Endpoints

### 1. Root / Health Check
- **URL**: `http://localhost:3000/`
- **Method**: `GET`
- **Purpose**: Verifies the server is running.
- **Response**: `Nirvyatha Backend is Analysis Service is Running. POST to /chat to analyze emotions.`

### 2. Emotion Analysis
- **URL**: `http://localhost:3000/chat`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "text": "User's message here"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "emotion": "anxious",
    "raw": "fear"
  }
  ```
- **Error Responses**:
    - **400 Bad Request**: Missing or empty `text` field.
    - **503 Service Unavailable**: Hugging Face model is "loading" (The frontend will automatically fallback to local logic).
    - **500 Internal Server Error**: Hugging Face API is down or configuration (Token) is missing.

---

## 🧠 Analysis Strategy

1. **Safety First**: The AI Engine performs a local high-priority check for safety triggers (self-harm/danger) before any external API call.
2. **AI Analysis**: If safety checks pass, the backend calls Hugging Face.
3. **Smart Mapping**:
    - `anger`, `disgust` -> **angry**
    - `fear` -> **anxious**
    - `sadness` -> **sad**
    - `joy` -> **happy**
4. **Resilient Fallback**: If the backend is unreachable or the AI model is loading, the **Frontend Local AI** (Regex-based) takes over immediately. This ensures the user never experiences a "crash" or waiting time.

---

## 🔑 Security

- **Hidden Tokens**: The Hugging Face API key is stored in a `.env` file on the server. It is **never** sent to the user's browser.
- **Anonymous**: No user IDs, IPs, or personal identifiers are sent to Hugging Face. The text is analyzed in total isolation.
