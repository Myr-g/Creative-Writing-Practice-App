const page_name = document.getElementById("title");
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
  generatePrompt("template");
});

async function generatePrompt(source)
{
  if(regenerationDisabled)
  {
    return;
  }

  regen_button.disabled = true;
  regen_button.textContent = "Generating...";

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
      regen_button.textContent = "Regenerate";
      return;
    }

    const data = await res.json();
    story_prompt.textContent = data.prompt;

    // Save prompt into the local story
    const storyId = localStorage.getItem("storyId");
    const story = window.story_manager.getStory(storyId);

    if(story) 
    {
      story.prompt = data.prompt;
      window.story_manager.saveStory(story);
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
      regen_button.textContent = "Regenerate";
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

  const story = window.story_manager.getStory(storyId);

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

    window.story_manager.saveStory(story);
    console.log("Story Updated");

    isDirty = false;

    showSaveStatus("Saved ✓", true, silent);
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

  const data = window.story_manager.getStory(storyId);

  if(!data)
  {
    window.location.href = "/";
    return;
  }

  page_name.textContent = data.title;
  story_title.textContent = data.title;
  
  if(data.promptType === "none")
  {
    regenerationDisabled = true;
    regen_button.disabled = true;
    regen_button.hidden = true;
  }

  else
  {
    if(!data.prompt)
    {
      generatePrompt("template");
    }

    story_prompt.textContent = data.prompt;
  }

  story_text.value = data.content;
});
