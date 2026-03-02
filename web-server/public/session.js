const story_title = document.getElementById("story_title");
const story_prompt = document.getElementById("story_prompt");
const story_text = document.getElementById("story_editor");
const regen_button = document.getElementById("regenerate_prompt");
const exit_button = document.getElementById("exit_session");
const save_button = document.getElementById("save_story");
const save_status = document.getElementById("save_status");

let timer;
let saving = false;
let isDirty = false;
let regenerationDisabled = false;

// Prompt Regeneration
regen_button.addEventListener("click", async () => {
  generatePrompt("static");
});

async function generatePrompt(source)
{
  if(regenerationDisabled)
  {
    return;
  }

  regen_button.disabled = true;
  regen_button.textContent = "Generating...";

  const sessionId = localStorage.getItem("sessionId");
  const userId = localStorage.getItem("userId");

  try
  {
    const res = await fetch(`/sessions/${sessionId}/generate-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, source })
    });

    if(res.status === 404)
    {
      console.error("Session not found OR user not in session:", res.status);
      regen_button.disabled = false;
      regen_button.textContent = "Regenerate";
      return;
    }

    if(res.status === 400)
    {
      console.error("Invalid prompt regeneration request:", res.status);
      regen_button.disabled = false;
      regen_button.textContent = "Regenerate";
      return;
    }

    if(res.status === 409)
    {
      console.log("promptLocked is true; prompt regeneration has been disabled.");
      regen_button.textContent = "Prompt Locked";
      regenerationDisabled = true;
      return;
    }

    if(!res.ok)
    {
      console.error("Unexpected error:", res.status);
      return;
    }

    const data = await res.json();

    story_prompt.textContent = data.prompt;
  }

  catch (err)
  {
    console.error(err);
  }

  finally 
  {
    if(!regenerationDisabled) 
    {
      regen_button.disabled = false;
      regen_button.textContent = "Regenerate";
    }
  }
}

// Exit Session
exit_button.addEventListener("click", async () => {

  const sessionId = localStorage.getItem("sessionId");
  const userId = localStorage.getItem("userId");

  try 
  {
    const res = await fetch(`/sessions/${sessionId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({userId})
    });

    if(res.status === 400)
    {
      console.error("Invalid leave request:", res.status);
      return;
    }

    if(res.status === 404)
    {
      console.error("Session not found OR user not in session:", res.status);
      return;
    }

    if(!res.ok)
    {
      console.error("Unexpected error:", res.status);
      return;
    }

    localStorage.removeItem("sessionId");
    window.location.href = "/";
  } 
  
  catch(err) 
  {
    console.error("Network error:", err);
  }
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

    const data = await res.json();

    if(data.promptLocked && !regenerationDisabled)
    {
      regenerationDisabled = true;
      regen_button.disabled = true;
      regen_button.textContent = "Prompt Locked";
    }
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

    const title = document.getElementById("title");
    title.textContent = data.name;
    story_title.textContent = data.name;
    regenerationDisabled = data.promptLocked;

    if(!data.prompt && !regenerationDisabled)
    {
      generatePrompt("static");
    }

    else
    {
      story_prompt.textContent = data.prompt;
    }

    if(regenerationDisabled && regen_button)
    {
      regen_button.disabled = true;
      regen_button.textContent = "Prompt Locked";
    }

    story_text.value = data.story;
  }

  catch(err) 
  { 
    console.error("Network error:", err); 
    window.location.href = "/";
  }
});
