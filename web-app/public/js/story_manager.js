const storage_key = "stories";

function loadStories()
{
    const storage = localStorage.getItem(storage_key);

    if(!storage)
    {
        return [];
    }

    return JSON.parse(storage);
}

function saveStories(stories)
{
    localStorage.setItem(storage_key, JSON.stringify(stories));
}

function getStories()
{
    return loadStories();
}

function getStory(id)
{
    const stories = loadStories();

    for(const story of stories)
    {
        if(story.id === id)
        {
            return story;
        }
    }

    return null;
}

function createStory(data)
{
    const stories = loadStories();

    const new_story = {
        id: "stry_" + crypto.randomUUID(),
        title: data.title,
        genre: data.genre,
        promptType: data.promptType,
        prompt: data.prompt,
        promptLocked: false,
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: null
    };

    stories.push(new_story);
    saveStories(stories);

    return new_story;
}

function saveStory(story)
{
    const stories = loadStories();

    for(let i = 0; i < stories.length; i++)
    {
        if(stories[i].id === story.id)
        {
            story.updatedAt = new Date().toISOString();
            
            if(stories[i].content.trim().length === 0 && story.content.trim().length > 0)
            {
                story.promptLocked = true;
            }
            
            stories[i] = story;
            break;
        }
    }

    saveStories(stories);
}

function deleteStory(id)
{
    const stories = loadStories();
    const storiesAfterDeletion = stories.filter(story => story.id !== id);
    saveStories(storiesAfterDeletion);
}

function formatStoryForDownload(story) 
{
  let formattedStory = [];

  formattedStory.push(story.title);
  
  const metadata = [];

  if(story.genre && story.genre.trim() !== "") 
  {
    metadata.push(`Genre: ${story.genre}`);
  }

  if(story.prompt && story.prompt.trim() !== "") 
  {
    metadata.push(`Prompt: ${story.prompt}`);
  }
  
  if(metadata.length > 0)
  {
  	formattedStory.push(metadata.join("\n"));
  }
  
  formattedStory.push("---");

  formattedStory.push(story.content || "");

  return formattedStory.join("\n\n");
}

window.story_manager = {
    getStories,
    getStory,
    createStory,
    saveStory,
    deleteStory,
    formatStoryForDownload
};