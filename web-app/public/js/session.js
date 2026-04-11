import { formatStoryToTxt } from "./download/txt_export.js";
import { formatStoryToPdf } from "./download/pdf_export.js";

const page_name = document.getElementById("title");
const story_title = document.getElementById("story_title");
const story_prompt = document.getElementById("story_prompt");
const story_text = document.getElementById("story_editor");
const regen_button = document.getElementById("regenerate_prompt");
const exit_button = document.getElementById("exit_session");
const save_button = document.getElementById("save_story");
const save_status = document.getElementById("save_status");
const download_button = document.getElementById("download_story");
const download_menu = document.getElementById("download_menu");
const txt_download_button = document.getElementById("txt_download");
const pdf_download_button = document.getElementById("pdf_download");

let regenerationDisabled = false;
let isExiting = false;
let timer;
let saving = false;
let isDirty = false;

async function getSessionData()
{
  const sessionId = localStorage.getItem("sessionId");
  const userId = localStorage.getItem("userId");

  const res = await fetch(`/sessions/${sessionId}?userId=${userId}`);
  
  if(!res.ok)
  {
    localStorage.clear();
    window.location.href = "/";
    return;
  }
  
  const data = await res.json();

  return {
    sessionId: data.sessionId,
    name: data.name,
    genre: data.genre,
    promptType: data.promptType,
    prompt: data.prompt,
    promptLocked: data.promptLocked,
    content: data.content,
    userCount: data.userCount,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  }
}


// Editing & saving story title
story_title.addEventListener("blur", saveTitle);

// Prevent Enter key from creating a new line and save
story_title.addEventListener("keydown", (e) => {
  if (e.key === "Enter") 
  {
    e.preventDefault();
    saveTitle(); // Save immediately
    story_title.blur(); // End editing
  }
});

async function saveTitle() 
{
  const data = await getSessionData();

  if(!data)
  {
    return;
  }

  let newTitle = story_title.textContent.trim();

  if(newTitle.length === 0) 
  {
    newTitle = "Untitled";
  }

  data.name = newTitle;
  story_title.textContent = newTitle;
  page_name.textContent = newTitle;

  saveStory(true);
}

// Prompt Regeneration
regen_button.addEventListener("click", async () => {
  const data = await getSessionData();
  generatePrompt(data.promptType, data.genre);
});

async function generatePrompt(source, genre)
{
  if(regenerationDisabled)
  {
    return;
  }

  regen_button.disabled = true;
  const icon = regen_button.querySelector('svg')
  icon.classList.add('spin');

  try
  {
    const res = await fetch(`/prompts/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({source, genre})
    });

    if(!res.ok) 
    {
      console.error("Prompt generation failed:", res.status);
      regen_button.disabled = false;
      regen_button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"/>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
        <path d="M3 22v-6h6"/>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>`;
      return;
    }

    const data = await res.json();
    story_prompt.textContent = data.prompt;
    story_prompt.innerHTML = story_prompt.textContent.replace(/\n/g, "<br>");
    saveStory(true);
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
      regen_button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"/>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
        <path d="M3 22v-6h6"/>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>`;
    }
  }
}

// Exit Session
exit_button.addEventListener("click", async () => {
  if(isDirty)
  {
    const ok = confirm("You have unsaved changes. Leave anyway?");

    if(!ok)
    {
      return;
    }
  }

  isExiting = true;
  
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
    localStorage.removeItem("userId");
    window.location.href = "/";
    isExiting = false;
  } 
  
  catch(err) 
  {
    console.error("Network error:", err);
    isExiting = false;
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
  if(isExiting)
  {
    return;
  }
  
  if(!isDirty)
  {
    return;
  }

  e.preventDefault();
  e.returnValue = "";
});

window.addEventListener("DOMContentLoaded", async() => {
  const userId = localStorage.getItem("userId");
  const sessionId = localStorage.getItem("sessionId");

  if(!userId && !sessionId)
  {
    window.location.href = "/";
    return;
  }

  const data = await getSessionData();

    const title = document.getElementById("title");
    title.textContent = data.name;
    story_title.textContent = data.name;
    regenerationDisabled = data.promptLocked;

    if(!data.prompt && !regenerationDisabled)
    {
      generatePrompt(data.promptType, data.genre);
    }

    else
    {
      story_prompt.textContent = data.prompt;
      story_prompt.innerHTML = story_prompt.textContent.replace(/\n/g, "<br>");
    }

    if(regenerationDisabled && regen_button)
    {
      regen_button.disabled = true;
      regen_button.textContent = "Prompt Locked";
    }

    story_text.value = data.content;
});
