import { getStory, saveStory as saveStorySM } from "./story_manager.js";
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

  const story = getStory(storyId);

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

  saveStorySM(story);
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

    // Save prompt into the local story
    const storyId = localStorage.getItem("storyId");
    const story = getStory(storyId);

    if(story) 
    {
      story.prompt = data.prompt;
      saveStorySM(story);
    }
  }

  catch (err)
  {
    console.error("Network error:", err);
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

// Exit
exit_button.addEventListener("click", async () => {
  localStorage.removeItem("storyId");
  window.location.href = "/";
});

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

  const storyId = localStorage.getItem("storyId");
  const text = story_text.value;

  if(!storyId)
  {
    console.error("Story ID not found.")
    showSaveStatus("Save Failed.", false, silent);
    saving = false;
    return;
  }

  const story = getStory(storyId);

  if(!story)
  {
    console.error("Story not found.");
    showSaveStatus("Save Failed.", false, silent);
    saving = false;
    return;
  }

  try
  {
    story.content = text;

    saveStorySM(story);
    console.log("Story Updated");

    isDirty = false;

    showSaveStatus("Saved ✓", true, silent);

    if(story.promptLocked && !regenerationDisabled)
    {
      regenerationDisabled = true;
      regen_button.disabled = true;
    }
  }

  catch(err)
  {
    console.error("Local save error:", err);
    showSaveStatus("Save Failed.", false, silent);
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

download_button.addEventListener("click", (event) => {
  event.stopPropagation();

  download_menu.classList.toggle("open");
});

txt_download_button.addEventListener("click", (event) => {
  event.stopPropagation();
  
  const storyId = localStorage.getItem("storyId");

  const story = getStory(storyId);

  if(!story)
  {
    return;
  }

  const blob = formatStoryToTxt(story);

  let filename = story.title.replace(/[\\\/:*?"<>|]/g, "");

  if(!filename)
  {
    filename = "story";
  }

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 100);
  download_menu.classList.remove("open");
});

pdf_download_button.addEventListener("click", async (event) => {
  event.stopPropagation();
  
  const storyId = localStorage.getItem("storyId");

  const story = getStory(storyId);

  if(!story)
  {
    return;
  }

  const blob = await formatStoryToPdf(story);

  let filename = story.title.replace(/[\\\/:*?"<>|]/g, "");

  if(!filename)
  {
    filename = "story";
  }

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 100);
  download_menu.classList.remove("open");
});

document.addEventListener("click", (event) => {
  if(!download_menu.contains(event.target) && event.target !== download_button) 
  {
    download_menu.classList.remove("open");
  }
});


window.addEventListener("beforeunload", (e) => {
  if (!isDirty) return;

  e.preventDefault();
  e.returnValue = "";
});

window.addEventListener("DOMContentLoaded", () => {
  const storyId = localStorage.getItem("storyId");

  if(!storyId)
  {
    window.location.href = "/";
    return;
  }

  const story = getStory(storyId);

  if(!story)
  {
    window.location.href = "/";
    return;
  }

  page_name.textContent = story.title;
  story_title.textContent = story.title;
  
  if(story.promptType === "none")
  {
    regenerationDisabled = true;
    regen_button.disabled = true;
    regen_button.hidden = true;
  }

  else
  {
    if(!story.prompt)
    {
      generatePrompt("template");
    }

    story_prompt.textContent = story.prompt;
  }

  regenerationDisabled = story.promptLocked;

  if(regenerationDisabled && regen_button)
  {
    regen_button.disabled = true;
  }

  story_text.value = story.content;
});
