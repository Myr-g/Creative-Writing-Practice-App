const express = require("express");
const { getGenres } = require("./genres");
const { createSession, getSessions, getSessionById, addUserToSession, removeUserFromSession } = require("./sessions");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Collaborative Story Server API is running");
});

app.get('/genres', (req, res) => {
    const genre_list = getGenres();
    res.status(200).json({genres: genre_list});
})

app.get('/sessions', (req, res) => {
    const sessions_list = getSessions();
    let summarized_sessions = [];

    for(let i = 0; i < sessions_list.length; i++)
    {
        summarized_sessions[i] = {
            id: sessions_list[i].id,
            name: sessions_list[i].name,
            genre: sessions_list[i].genre,
            users: sessions_list[i].users.size,
            createdAt: sessions_list[i].createdAt
        }
    }

    res.status(200).json({sessions: summarized_sessions});
});

app.post('/sessions', (req, res) => {
    console.log(req.body);

    const {name, genre} = req.body;
    const genre_list = getGenres();
    let chosen_genre = null;

    if(!name || !genre)
    {
        res.sendStatus(400);
        return;
    }

    for(let i = 0; i < genre_list.length; i++)
    {
        if(genre.toLowerCase() == genre_list[i].name.toLowerCase())
        {
            chosen_genre = genre_list[i];
            break;
        }
    }

    if(chosen_genre === null)
    {
        res.sendStatus(400);
        return;
    }

    const session = createSession(name, chosen_genre);

    if(!session)
    {
        // Duplicate Session Name
        res.sendStatus(409);
        return;
    }

    res.status(201).json({
        id: session.id,
        name: session.name,
        genre: session.genre,
        createdAt: session.createdAt
    });
});

app.post('/sessions/:id/join', (req, res) => {
    const {id} = req.params;
    const {username} = req.body;

    if(!getSessionById(id))
    {
        res.sendStatus(404);
        return;
    }

    if(!username)
    {
        res.sendStatus(400);
        return;
    }

    const joined = addUserToSession(id, username);

    if(!joined)
    {
        res.sendStatus(404);
        return;
    }

    res.status(200).json({
        sessionId: joined.session.id,
        userId: joined.user.id,
        username: joined.user.name
    });
});

app.post('/sessions/:id/leave', (req, res) => {
    const {id} = req.params;
    const {userId} = req.body;

    if(!getSessionById(id))
    {
        res.sendStatus(404);
        return;
    }

    if(!userId)
    {
        res.sendStatus(400);
        return;
    }

    if(!removeUserFromSession(id, userId))
    {
        res.sendStatus(404);
        return;
    }

    res.status(200).json({
        userId: userId,
    });
});

app.post('/sessions/:id/write', (req, res) => {
    const {id} = req.params;
    const{userId, text, mode} = req.body;

    const session = getSessionById(id);

    if(!session)
    {
        res.sendStatus(404);
        return;
    }

    if(!userId || typeof text != "string" || !mode)
    {
        res.sendStatus(400);
        return;
    }

    if(!session.users.has(userId))
    {
        res.sendStatus(404);
        return;
    }

    if(mode === "replace")
    {
        session.story = text;
    }

    else if(mode === "append")
    {
        session.story += text;
    }

    else
    {
        res.sendStatus(400);
        return;
    }

    res.sendStatus(200);
});

app.get('/sessions/:id', (req, res) => {
    const {id} = req.params;
    const {userId} = req.query;

    const session = getSessionById(id);

    if(!session)
    {
        res.sendStatus(404);
        return;
    }

    if(!userId)
    {
        res.sendStatus(400);
        return;
    }

    if(!session.users.has(userId))
    {
        res.sendStatus(403);
        return;
    }

    const response = {
        sessionId: session.id,
        name: session.name,
        genre: session.genre,
        story: session.story,
        userCount: session.users.size,
        createdAt: session.createdAt
    };

    res.status(200).json(response);
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});