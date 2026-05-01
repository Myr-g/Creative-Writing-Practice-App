import { formatStoryForDownload } from "../story_manager.js";

function formatStoryToTxt(story) 
{ 
    const story_data = formatStoryForDownload(story); 

    const formattedStory = []; 
    
    formattedStory.push(story_data.title || story_data.name); 

    const metadata = story_data.metadata; 

    if(metadata.length > 0) 
    { 
        formattedStory.push(metadata.join("\n")); 
    } 
    
    formattedStory.push("---"); 
    
    let content = ""; 
    
    content = story_data.content.join('\n'); 
    formattedStory.push(content || ""); 

    const blob = new Blob([formattedStory.join("\n\n")], { type: "text/plain" });
    
    return blob;
}

export { formatStoryToTxt };
