const { get } = require("https");
const { generateSessionId, generateUserId } = require("./utils/ids");

const sessions_by_id = new Map(); // key is the session id, value is the session
const sessions_by_name = new Map(); //key is the session name, value is the session id

function createSession(name, genre, promptType)
{
    const display_name = name;
    const normalized_name = name.toLowerCase();

    if(sessions_by_name.has(normalized_name))
    {
        return null;
    }

    const session_id = generateSessionId();

    let new_session = {
        id: session_id,
        name: display_name,
        genre: genre,
        promptType: promptType,
        prompt: "",
        promptLocked: false,
        content: "",
        users: new Map(),
        createdAt: new Date().toISOString(),
        updatedAt: null
    };

    sessions_by_id.set(session_id, new_session);
    sessions_by_name.set(normalized_name, session_id);

    return new_session;
}

function getSessionById(session_id)
{
    if(sessions_by_id.has(session_id))
    {
        return sessions_by_id.get(session_id);
    }

    else
    {
        return null;
    }
}

function getSessionByName(session_name)
{
    const normalized_name = session_name.toLowerCase();

    if(sessions_by_name.has(normalized_name))
    {
        return getSessionById(sessions_by_name.get(normalized_name));
    }

    else
    {
        return null;
    }
}

function getSessions()
{
    const sessions_array = Array.from(sessions_by_id, ([id, session]) => ({ ...session }));
    return sessions_array;
}

function addUserToSession(session_id, username)
{
    const session = getSessionById(session_id);

    if(!session)
    {
        return null;
    }

    const user_id = generateUserId();

    let new_user = {
        id: user_id,
        name: username,
        joinedAt: new Date().toISOString()
    };

    session.users.set(user_id, new_user);

    return {session, user: new_user};
}

function removeUserFromSession(session_id, user_id)
{
    const session = getSessionById(session_id);

    if(!session)
    {
        return false;
    }

    if(!session.users.delete(user_id))
    {
        return false;
    }

    if(session.users.size === 0)
    {
        sessions_by_id.delete(session_id);
        sessions_by_name.delete(session.name.toLowerCase());
    }

    return true;
}

module.exports = {createSession, getSessionById, getSessionByName, getSessions, addUserToSession, removeUserFromSession};