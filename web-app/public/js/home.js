const username_input = document.getElementById("username");
const session_name = document.getElementById("session_name");
const selected_genre = document.getElementById("genre_select");
const create_button = document.getElementById("create_session");

const session_id = localStorage.getItem("sessionId");
const user_id = localStorage.getItem("userId");

let joining = false;

// Populate genre dropdown
fetch('/genres')
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById("genre_select");
    select.length = 1;

    data.genres.forEach(genre => {
      const option = document.createElement("option");
      option.value = genre.name;
      option.textContent = genre.name;
      select.appendChild(option);
    });
  });

loadStoriesList();

function loadStoriesList()
{
  const stories = window.story_manager.getStories();
  const stories_list = document.getElementById("stories_list");
  stories_list.innerHTML = "";

  if(stories.length === 0)
  {
    const li = document.createElement("li");
    li.textContent = "No saved stories — create one to get started!";
    stories_list.appendChild(li);
  }

  else
  {
    for(const story of stories)
    {
      const li = document.createElement("li");
      li.classList.add("story-item");
      li.dataset.storyId = story.id;

      li.addEventListener("click", () => {
        localStorage.setItem("storyId", story.id);
        window.location.href = "/writing.html";
      });

      const titleSpan = document.createElement("span");
      titleSpan.textContent = story.title;

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("delete_story")
      deleteButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4h6v2"></path>
      </svg>`;

      deleteButton.addEventListener("click", (event) => {
      
        event.stopPropagation();
        if(window.confirm("Are you sure?"))
        {
          window.story_manager.deleteStory(story.id);
          loadStoriesList();
        }
      })

      li.appendChild(titleSpan);
      li.appendChild(deleteButton);
      stories_list.appendChild(li);
    }
  }
}

// Populate active sessions list
loadSessionsList();
setInterval(loadSessionsList, 5000);

async function loadSessionsList()
{
  if(joining)
  {
    return;
  }

  try
  {
    const res = await fetch('/sessions');

    if(!res.ok)
    {
      console.error("Failed to fetch sessions:", res.status);
      return;
    }

    const data = await res.json();

    const sessions_list = document.getElementById("sessions_list");
    sessions_list.innerHTML = "";

    if(data.sessions.length === 0)
    {
      const li = document.createElement("li");
      li.textContent = "No active sessions — create one of your own!";
      sessions_list.appendChild(li);
      return;
    }

    data.sessions.forEach(session => {
      const li = document.createElement("li");
      li.classList.add("session-item");
      li.textContent = `${session.name} - ${session.genre.name} | Writers: ${session.users}`;
      li.dataset.sessionId = session.id;

      li.addEventListener("click", async () => {
        const username = username_input.value.trim();

        if(!username)
        {
          console.error("Missing username.");
          return;
        }
          
        if(window.confirm(`Join ${session.name}?`))
        {
          joining = true;
          
          const joinRes = await fetch(`/sessions/${li.dataset.sessionId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({username})
          });

          if(joinRes.status === 400)
          {
            console.error("Missing username:", joinRes.status);
            return;
          }

          if(joinRes.status === 404)
          {
            console.error("Session join failed:", joinRes.status);
            return;
          }

          if(!joinRes.ok)
          {
            console.error("Unexpected error:", joinRes.status);
            return;
          }

          const joinData = await joinRes.json();

          localStorage.setItem("sessionId", joinData.sessionId);
          localStorage.setItem("userId", joinData.userId);
          localStorage.setItem("username", joinData.username);

          console.log("Joined session:", joinData);
          window.location.href = "/session.html";
        }
      })
      
      sessions_list.appendChild(li);
    })
  }

  catch(err)
  {
    console.error("Network error:", err);
  }

  finally
  {
    joining = false;
  }
}

// Session creation
create_button.addEventListener("click", async () => {
  const username = username_input.value.trim();
  const name = session_name.value.trim();
  const genre = selected_genre.value;

  if(!username || !name || !genre) 
  {
    console.error("Missing username, session name, or genre.");
    return;
  }

  const data = {
    title: name,
    genre: genre,
    promptType: "template", 
    prompt: ""              
  };

  const story = window.story_manager.createStory(data);
  localStorage.setItem("storyId", story.id);
  window.location.href = "/writing.html";

  /*
  try 
  {
    const createRes = await fetch("/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, genre })
    });

    if(createRes.status === 400)
    {
      console.error("Invalid session creation request:", createRes.status);
      return;
    }

    if(createRes.status === 409)
    {
      console.error("Session name already exists:", createRes.status);
      return;
    }

    if(!createRes.ok) 
    {
      console.error("Unexpected error:", createRes.status);
      return;
    }

    const createData = await createRes.json();
    console.log("Session created:", createData);

    const sessionId = createData.id;

    joining = true;

    const joinRes = await fetch(`/sessions/${sessionId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({username})
    });

    if(joinRes.status === 400)
    {
      console.error("Missing username:", joinRes.status);
      return;
    }

    if(joinRes.status === 404)
    {
      console.error("Session join failed:", joinRes.status);
      return;
    }

    if(!joinRes.ok)
    {
      console.error("Unexpected error:", joinRes.status);
      return;
    }

    const joinData = await joinRes.json();

    localStorage.setItem("sessionId", joinData.sessionId);
    localStorage.setItem("userId", joinData.userId);
    localStorage.setItem("username", joinData.username);

    console.log("Joined session:", joinData);
    window.location.href = "/session.html";
  } 
  
  catch (err) 
  {
    console.error("Network error:", err);
  }

  finally
  {
    joining = false;
  }*/
});