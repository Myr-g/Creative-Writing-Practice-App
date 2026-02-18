const story_title = document.getElementById("story_title");
const story_prompt = document.getElementById("story_prompt");
const story_text = document.getElementById("story_editor");

const exit_button = document.getElementById("exit_session");

const save_button = document.getElementById("save_story");
const save_status = document.getElementById("save_status");

let timer;
let saving = false;
let isDirty = false;

// Exit Session
exit_button.addEventListener("click", () => {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    window.location.href = "/";
});

// Save story text to session

// Manual save
save_button.addEventListener("click", async () => {
  clearTimeout(timer);
  saveStory(false);
});

// Autosave
story_text.addEventListener("input", async () => {
  if(!isDirty)
  {
    isDirty = true;
    showSaveStatus("Saving...", null, false);
  }
  
  clearTimeout(timer);

  timer = setTimeout(() => {
    saveStory(true);
  }, 1500);
});

async function saveStory(silent)
{
  if(saving)
  {
    return;
  }

  saving = true;

  const sessionId = localStorage.getItem("sessionId");
  const userId = localStorage.getItem("userId");
  const text = story_text.value;

  if(!sessionId || !userId)
  {
    console.error("Session or user not found.")
    return;
  }

  try
  {
    const res = await fetch(`/sessions/${sessionId}/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({userId, text, mode: "replace"})
    });

    if(res.status === 400)
    {
      console.error("Invalid write request:", res.status);
      showSaveStatus("Save Failed.", false, silent);
      return;
    }

    if(res.status === 404)
    {
      console.error("Session not found OR user not in session:", res.status);
      showSaveStatus("Save Failed.", false, silent);
      return;
    }

    if(!res.ok)
    {
      console.error("Unexpected error:", res.status);
      showSaveStatus("Save Failed.", false, silent);
      return;
    }

    console.log("Story Updated.");
    isDirty = false;
    showSaveStatus("Saved ✓", true, silent);
  }

  catch(err)
  {
    console.error("Network error:", err);
  }

  finally
  {
    saving = false;
  }
}

function showSaveStatus(message, success = true, silent = false)
{
  if(silent)
  {
    return;
  }

  save_status.textContent = message;
  save_status.classList.add("visible");

  if(success === false)
  {
    save_status.style.color = "red";
  }

  else if(success === null)
  {
    save_status.style.color = "#666";
  }

  else
  {
    save_status.style.color = "green";
  }

  setTimeout(() => {
    save_status.classList.remove("visible");
  }, 1500);
}

window.addEventListener("beforeunload", (e) => {
  if (!isDirty) return;

  e.preventDefault();
  e.returnValue = "";
});

window.addEventListener("DOMContentLoaded", async() => {
  const sessionId = localStorage.getItem("sessionId");
  const userId = localStorage.getItem("userId");

  if(!sessionId || !userId)
  {
    window.location.href = "/";
    return;
  }

  try
  {
    const res = await fetch(`/sessions/${sessionId}?userId=${userId}`);
    
    if(!res.ok)
    {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    const data = await res.json();

    story_title.textContent = data.name;
    story_prompt.textContent = data.genre.prompt;
    story_text.value = data.story;
  }

  catch(err) 
  { 
    console.error("Network error:", err); 
    window.location.href = "/";
  }
});
