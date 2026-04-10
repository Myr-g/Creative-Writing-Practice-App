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

let timer;
let saving = false;
let isDirty = false;
let regenerationDisabled = false;

// Editing & saving story title
story_title.addEventListener("blur", saveTitle);

// Prevent Enter key from creating a new line and save
story_title.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveTitle(); // Save immediately
    story_title.blur(); // End editing
  }
});

function saveTitle() 
{
  const storyId = localStorage.getItem("storyId");

  if(!storyId)
  {
    return;
  }

  const story = window.story_manager.getStory(storyId);

  if(!story)
  {
    return;
  }

  let newTitle = story_title.textContent.trim();

  if(newTitle.length === 0) 
  {
    newTitle = "Untitled";
  }

  story.title = newTitle;
  story_title.textContent = newTitle;
  page_name.textContent = newTitle;

  window.story_manager.saveStory(story);
}

// Prompt Regeneration
regen_button.addEventListener("click", async () => {
  generatePrompt("template");
});

async function generatePrompt(source)
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
      body: JSON.stringify({source})
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
    saveStory();
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
    localStorage.removeItem("userId");
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
  const userId = localStorage.getItem("userId");
  const sessionId = localStorage.getItem("sessionId");

  if(!userId && !sessionId)
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
      generatePrompt(data.promptSource);
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

    story_text.value = data.story;
  }

  catch(err) 
  { 
    console.error("Network error:", err); 
    window.location.href = "/";
  }
});
