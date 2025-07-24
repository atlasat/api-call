# API Documentation - Outgoing Call Service

**Version:** 1.0.3  
**Last Updated:** July 2025  
**Base URL:** `https://api-call.optimaccs.com`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Integration](#websocket-integration)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)

---

## Overview

The Outgoing Call API provides a comprehensive solution for managing voice calls through REST endpoints and real-time WebSocket communication. This service enables applications to initiate outbound calls, manage call sessions, and handle bi-directional audio streaming.

### Key Features

- Outbound call initiation
- Real-time call status updates
- Bi-directional audio streaming
- Session management
- Multiple audio format support

---

## Authentication

All API requests require a Bearer token for authentication.

### Header Requirements

| Parameter       | Type   | Required | Description                                |
| --------------- | ------ | -------- | ------------------------------------------ |
| `Authorization` | String | Yes      | Bearer token format: `Bearer [your_token]` |

**Example:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## REST API Endpoints

### 1. Initiate Outgoing Call

Initiates a new outbound call to the specified phone number.

**Endpoint:** `POST /pbx/call`

#### Request Parameters

| Parameter     | Type   | Required | Description                 |
| ------------- | ------ | -------- | --------------------------- |
| `phoneNumber` | String | Yes      | Target phone number to call |

#### Request Example

```json
{
  "phoneNumber": "089608675796"
}
```

#### Response Parameters

| Parameter          | Type   | Description                                  |
| ------------------ | ------ | -------------------------------------------- |
| `status`           | Number | HTTP status code (200: success, 500: failed) |
| `errors`           | String | Error message (empty if successful)          |
| `data`             | Object | Response data containing call details        |
| `data.phoneNumber` | String | The dialed phone number                      |
| `data.sessionId`   | String | Unique session identifier                    |

#### Response Example

```json
{
  "status": 200,
  "errors": "",
  "data": {
    "phoneNumber": "089608675796",
    "sessionId": "bb4ad603-d3d9-4729-929c-7497a617cb26"
  }
}
```

### 2. Terminate Call

Terminates an active call session.

**Endpoint:** `POST /pbx/hangup`

#### Request Parameters

| Parameter   | Type   | Required | Description                                |
| ----------- | ------ | -------- | ------------------------------------------ |
| `sessionId` | String | Yes      | Session ID from the outgoing call response |

#### Request Example

```json
{
  "sessionId": "bb4ad603-d3d9-4729-929c-7497a617cb26"
}
```

#### Response Parameters

| Parameter        | Type   | Description                                  |
| ---------------- | ------ | -------------------------------------------- |
| `status`         | Number | HTTP status code (200: success, 500: failed) |
| `errors`         | String | Error message (empty if successful)          |
| `data`           | Object | Response data                                |
| `data.sessionId` | String | Terminated session identifier                |

#### Response Example

```json
{
  "status": 200,
  "errors": "",
  "data": {
    "sessionId": "bb4ad603-d3d9-4729-929c-7497a617cb26"
  }
}
```

---

## WebSocket Integration

The service uses Socket.IO for real-time communication and audio streaming.

### Connection Setup

```javascript
const SOCKET_CONFIG = {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  auth: {
    token: "your_bearer_token",
  },
};

const SERVER_URL = "https://api-call.optimaccs.com";
const socket = io(SERVER_URL, SOCKET_CONFIG);
```

### Event Flow Diagram

The following diagram illustrates the typical event flow for an outgoing call session:

```
Client                    Server
  |                        |
  |--- POST /pbx/call ---->|
  |<-- sessionId ----------|
  |                        |
  |<-- newSession ---------|
  |--- joinRoom ---------->|
  |<-- roomJoined ---------|
  |                        |
  |<-- dialStatus ---------|
  |--- audio ------------->|
  |<-- audio --------------|
  |---  checkPoint ------->|
  |<-- checkPoint ---------|
   |--------  dtmf ------->|
  |<-------- dtmf ---------|
  |                        |
  |--- hangup ------------>|
  |<-- hangup -------------|
```

### Events Reference

#### Server to Client Events

##### `newSession`

Triggered when a new call session is created via REST API.

```javascript
socket.on("newSession", (data) => {
  /*
  data: {
    sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f',
    type: 'outbound' // 'outbound' or 'inbound'
  }
  */
});
```

##### `roomJoined`

Confirmation that the client has successfully joined the call room.

```javascript
socket.on("roomJoined", (data) => {
  /*
  data: {
    sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f',
    status: 'success' // 'success' or 'failed'
  }
  */
});
```

##### `dialStatus`

Real-time call status updates.

```javascript
socket.on("dialStatus", (data) => {
  /*
  data: {
    sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f',
    status: 'Dialing' // 'Dialing', 'Ringing', 'Busy', 'Connected'
  }
  */
});
```

##### `dtmf`

Receive dtmf.

```javascript
socket.on("dtmf", (data) => {
  /*
  data: {
    sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f',
    digit: '1' // 1, 2, 3, 4 5, a, b etc
  }
  */
});
```

##### `audio`

Receives audio data from the call. Audio format: 320-byte signed linear, 16-bit, 8kHz, mono PCM (little-endian).

```javascript
socket.on("audio", (data) => {
  /*
  data: {
    sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f',
    audioData: <Buffer 33 29 12 94> // Buffer type
  }
  */
});
```

##### `checkPoint`

Notifies the client that a previously submitted checkpoint has completed audio playback.

```javascript
socket.on("checkPoint", (data) => {
  /*
  data: {
    sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f',
    name: your check point name
  }
  */
});
```


##### `hangup`

Notification that the call has been terminated.

```javascript
socket.on("hangup", (data) => {
  /*
  data: {
    sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f'
  }
  */
});
```

#### Client to Server Events

##### `joinRoom`

Request to join a call session room.

```javascript
socket.emit("joinRoom", {
  sessionId: "07475d2c-32c9-4f4b-8103-6db8c0dc741f",
});
```

##### `audio`

Send audio data to the call. Supports multiple audio formats.

```javascript
socket.emit('audio', {
  audioData: <Buffer 33 29 12 94>,
  sessionId: '07475d2c-32c9-4f4b-8103-6db8c0dc741f',
  audioFormat: 'mp3', // 'mp3', 'ulaw', 'alaw', 'pcm16'
}, (acknowledgment) => {
  /*
  acknowledgment: {
    success: true,
    error: null
  }
  */
});
```

##### `checkPoint`

Send checkPoint or mark after send audio.

```javascript
socket.emit("checkPoint", {
  sessionId: "07475d2c-32c9-4f4b-8103-6db8c0dc741f",
  name: "mark audio playback",
});
```

##### `dtmf`

Send dtmf audio

```javascript
socket.emit("dtmf", {
  sessionId: "07475d2c-32c9-4f4b-8103-6db8c0dc741f",
  digit: "1",
  duration: 200, // in milisecond
});
```

**Supported Audio Formats:**

- `mp3` (default)
- `ulaw`
- `alaw`
- `pcm16`

##### `interruption`

Stop currently playing audio and clear the audio queue.

```javascript
socket.emit("interruption", {
  sessionId: "07475d2c-32c9-4f4b-8103-6db8c0dc741f",
});
```

##### `hangup`

Request to terminate the call.

```javascript
socket.emit("hangup", {
  sessionId: "07475d2c-32c9-4f4b-8103-6db8c0dc741f",
});
```

---

## Error Handling

### HTTP Status Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 200  | Success                                 |
| 400  | Bad Request - Invalid parameters        |
| 401  | Unauthorized - Invalid or missing token |
| 404  | Not Found - Resource not found          |
| 500  | Internal Server Error                   |

### Common Error Responses

```json
{
  "status": 400,
  "errors": "Invalid phone number format",
  "data": null
}
```

```json
{
  "status": 401,
  "errors": "Authentication token is required",
  "data": null
}
```

---

## Code Examples

### Complete Call Flow Example

```javascript
// Initialize Socket.IO connection
const socket = io("https://api-call.optimaccs.com", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  auth: {
    token: "your_bearer_token",
  },
});

// Step 1: Initiate call via REST API
async function initiateCall(phoneNumber) {
  try {
    const response = await fetch("https://api-call.optimaccs.com/pbx/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_bearer_token",
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const result = await response.json();
    if (result.status === 200) {
      return result.data.sessionId;
    }
    throw new Error(result.errors);
  } catch (error) {
    console.error("Failed to initiate call:", error);
    throw error;
  }
}

// Step 2: Set up WebSocket event listeners
function setupSocketListeners() {
  socket.on("newSession", (data) => {
    console.log("New session created:", data.sessionId);
    // Join the call room
    socket.emit("joinRoom", { sessionId: data.sessionId });
  });

  socket.on("roomJoined", (data) => {
    if (data.status === "success") {
      console.log("Successfully joined room:", data.sessionId);
    }
  });

  socket.on("dialStatus", (data) => {
    console.log("Call status:", data.status);
    if (data.status === "Connected") {
      // Call is connected, you can now send audio
      sendAudio(data.sessionId);
    }
  });

  socket.on("audio", (data) => {
    // Handle incoming audio data
    processIncomingAudio(data.audioData);
  });

  socket.on("hangup", (data) => {
    console.log("Call ended:", data.sessionId);
  });
}

// Step 3: Send audio data
function sendAudio(sessionId, audioBuffer) {
  socket.emit(
    "audio",
    {
      audioData: audioBuffer,
      sessionId: sessionId,
      audioFormat: "mp3",
    },
    (ack) => {
      if (ack.success) {
        console.log("Audio sent successfully");
      } else {
        console.error("Failed to send audio:", ack.error);
      }
    }
  );
}

// Step 4: Terminate call
async function terminateCall(sessionId) {
  try {
    const response = await fetch("https://api-call.optimaccs.com/pbx/hangup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_bearer_token",
      },
      body: JSON.stringify({ sessionId }),
    });

    const result = await response.json();
    return result.status === 200;
  } catch (error) {
    console.error("Failed to terminate call:", error);
    return false;
  }
}

// Usage example
async function makeCall() {
  setupSocketListeners();

  try {
    const sessionId = await initiateCall("089608675796");
    console.log("Call initiated with session ID:", sessionId);

    // Wait for call to connect, then interact as needed
    // Call will be terminated automatically or manually via terminateCall()
  } catch (error) {
    console.error("Call failed:", error);
  }
}
```

---

## Best Practices

1. **Connection Management**: Implement proper reconnection logic for WebSocket connections
2. **Error Handling**: Always handle both HTTP and WebSocket errors gracefully
3. **Audio Buffering**: Implement proper audio buffering for smooth playback
4. **Session Management**: Keep track of active sessions and clean up resources

---

## Support

For technical support and questions, please contact:

- Documentation Version: 1.0.3
- API Base URL: https://api-call.optimaccs.com
- Support: [Contact your API provider]
