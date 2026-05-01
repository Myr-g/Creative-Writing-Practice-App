import { getStories, deleteStory, createStory } from "./story_manager.js";

const new_story_panel_toggle = document.getElementById("new_story");
const new_story_panel = document.getElementById("new_story_panel");

const story_title = document.getElementById("story_title");
const solo_button = document.getElementById("solo_story");
const collaborative_button = document.getElementById("collaborative_story");
const username_label = document.getElementById("username_label");
const username_input = document.getElementById("username");
const selected_genre = document.getElementById("genre_select");
const prompt_type = document.getElementById("prompt_type");
const cancel_button = document.getElementById("cancel_new_story");
const create_button = document.getElementById("create_new_story");

let story_type = "solo";
let joining = false;

new_story_panel_toggle.addEventListener("click", () => {
  new_story_panel.hidden = false;
  story_title.focus();
  story_title.select();
});

new_story_panel.addEventListener("click", (event) => {
  event.stopPropagation();
});

// Close panel if user clicks outside of it
document.addEventListener("click", (event) => {
  if(!new_story_panel.contains(event.target) && event.target !== new_story_panel_toggle) 
  {
    new_story_panel.hidden = true;
  }
});

// Close panel on esc key press
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    new_story_panel.hidden = true;
  }
});

solo_button.addEventListener("click", () => {
  story_type = "solo";
  solo_button.classList.add("active");
  collaborative_button.classList.remove("active");
  username_label.hidden = true;
  username_input.hidden = true;
});

collaborative_button.addEventListener("click", () => {
  story_type = "collaborative";
  collaborative_button.classList.add("active");
  solo_button.classList.remove("active");
  username_label.hidden = false;
  username_input.hidden = false
  username_input.focus();
  
  if(localStorage.getItem("username"))
  {
    username_input.value = localStorage.getItem("username");
  }
});


// Populate genre dropdown
fetch('/genres')
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById("genre_select");
    select.length = 1;

    data.genres.forEach(genre => {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      select.appendChild(option);
    });
  });

loadStoriesList();

function loadStoriesList()
{
  const stories = getStories();
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
          deleteStory(story.id);
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
      li.textContent = `${session.title} - ${session.genre} | Writers: ${session.users}`;
      li.dataset.sessionId = session.id;

      li.addEventListener("click", async () => {
        const username = username_input.value.trim();

        if(!username)
        {
          console.error("Missing username.");
          return;
        }
          
        if(window.confirm(`Join ${session.title}?`))
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
  let title = story_title.value.trim();
  const genre = selected_genre.value;

  if(story_type === "solo")
  {
    if(!title)
    {
      title = "Untitled";
    }

    const data = {
      title: title,
      genre: genre,
      promptType: prompt_type.value, 
      prompt: ""              
    };

    const story = createStory(data);
    localStorage.setItem("storyId", story.id);
    window.location.href = "/writing.html";
  }

  else
  {
    try 
    {
      const username = username_input.value.trim();
      const promptType = prompt_type.value;

      if(!username)
      {
        console.error("Missing username");
        return;
      }

      if(!title)
      {
        title = "Untitled";
      }

      const createRes = await fetch("/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({title, genre, promptType})
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
    }
  }
});

cancel_button.addEventListener("click", () => {
  new_story_panel.hidden = true;
});