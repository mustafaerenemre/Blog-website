// CRITICAL: Ensure this URL matches your Uvicorn host and port
const API_URL = 'http://127.0.0.1:8000/posts';

// --- 1. GET ALL POSTS (RELOAD) ---
async function fetchPosts() {
   const container = document.getElementById('posts-container');
   container.innerHTML = '<div class="loader">Fetching posts...</div>';

   try {
      const response = await fetch(API_URL);
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const posts = await response.json();

      container.innerHTML = ''; // Clear the loader

      if (posts.length === 0) {
         container.innerHTML = '<p class="loader">No posts found. Try creating one!</p>';
         return;
      }

      // Render each post as a card
      posts.reverse().forEach(post => { // Display newest posts first
         const card = document.createElement('div');
         card.className = 'post-card';

         const title = document.createElement('h3');
         title.textContent = post.title;

         const idStatus = document.createElement('p');
         idStatus.className = 'post-status';
         idStatus.textContent = `ID: ${post.id} | Status: ${post.is_published ? 'PUBLISHED' : 'DRAFT'}`;

         const content = document.createElement('p');
         // Display a snippet of the content
         content.textContent = post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');

         card.appendChild(title);
         card.appendChild(idStatus);
         card.appendChild(content);
         container.appendChild(card);
      });

   } catch (e) {
      console.error("Could not fetch posts:", e);
      container.innerHTML = `<p class="loader" style="color: red;">Network Error: Could not connect to API at ${API_URL}. Is your server running?</p>`;
   }
}

// --- 2. CREATE NEW POST ---
async function createNewPost() {
   // Get references to the input fields and message area
   const titleInput = document.getElementById('post-title');
   const contentInput = document.getElementById('post-content');
   const publishedInput = document.getElementById('post-published');
   const messageDisplay = document.getElementById('post-message');

   messageDisplay.textContent = 'Submitting...';
   messageDisplay.style.color = "blue";

   const newPostData = {
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      is_published: publishedInput.checked
   };

   // Basic validation
   if (!newPostData.title || !newPostData.content) {
      messageDisplay.textContent = "Title and Content are required!";
      messageDisplay.style.color = "red";
      return;
   }

   try {
      const response = await fetch(API_URL, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(newPostData)
      });

      if (response.ok) {
         // Success: Clear the form and reload
         titleInput.value = '';
         contentInput.value = '';
         publishedInput.checked = true;

         const createdPost = await response.json();

         messageDisplay.textContent = `Post created successfully! (ID: ${createdPost.id})`;
         messageDisplay.style.color = "green";

         await new Promise(resolve => setTimeout(resolve, 100));
         fetchPosts(); // Reload the list

      } else {
         // Failure: Read error message from the API response
         const error = await response.json();
         console.error("Creation Failed:", error);
         messageDisplay.textContent = `Creation Failed (${response.status}). Detail: ${error.detail ? error.detail.content : 'Unknown Error'}`;
         messageDisplay.style.color = "red";
      }

   } catch (e) {
      // Network Error
      console.error("Network Error during creation:", e);
      messageDisplay.textContent = "Network Error: Could not connect to API.";
      messageDisplay.style.color = "red";
   }

   // Reload the post list to show the new entry
   fetchPosts();
}

// Initial load of posts when the page loads
fetchPosts();