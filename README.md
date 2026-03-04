## Collaborative Story Server
A multi‑user storytelling platform with both a C TCP server and a modern web‑app interface.

## Overview
Collaborative Story Server lets multiple users build a shared story together in real time. The project includes:

- A C‑based TCP server + CLI client for low‑level networking and concurrency.

- A web‑app version with a browser UI for easier access and broader usability.

- Both versions support joining sessions, writing collaboratively, and viewing the evolving story.

## Features
### C TCP Server
- Multi‑client TCP server written in C

- Thread‑safe shared story state

- Command‑based interaction model

- Logging for debugging and auditing

- Modular structure for networking, parsing, and story logic

### Web‑App
- Browser‑based UI (HTML/CSS/JS)

- Node.js/Express backend

- REST API for sessions and story updates

- Dark‑mode styling

## Running the C Server
### Build
```
gcc -o server src/server/*.c
gcc -o client src/client/*.c
```

### Run
```
./server
./client <server-ip> <port>
```

 ### Commands
JOIN <username>

SESSION CREATE <name> <genre>

SESSION JOIN <name>

LIST SESSIONS

VIEW

WRITE <text>

EXIT SESSION

QUIT

## Running the Web-App
### Install & Start
```
npm install
npm start
```

then go to http://localhost:8080
