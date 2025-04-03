async function uploadVideo() {
    document.getElementById("myForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/video', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                const videoPlayer = document.getElementById('videoPlayer');
                videoPlayer.src = `/videos/${data.video.id}`;
                videoPlayer.play();
                await fetchVideos();
                form.reset()
            } else {
                console.error("Upload failed:", data);
            }
        } catch (error) {
            console.error("Error uploading video:", error);
        }

    });
}

async function playVideo(id) {
    try {
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.src = `/videos/${id}`;
        videoPlayer.play();
    } catch (error) {
        console.error("Error playing video:", error);
    }
}

async function deleteVideo(id) {
    try {
        const response = await fetch(`/videos/${id}`, { method: 'DELETE' });

        if (response.ok) {
            await fetchVideos();
        } else {
            console.error("Failed to delete video");
        }
    } catch (error) {
        console.error("Error deleting video:", error);
    }
}

async function updateVideo(id, name) {
    try {

        const editedName = window.prompt('Edit video name', name)

        const response = await fetch(`/videos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: `${editedName}` })
        });

        if (response.ok) {
            await fetchVideos();
        } else {
            console.error("Failed to update video");
        }
    } catch (error) {
        console.error("Error updating video:", error);
    }
}

async function fetchVideos() {
    try {
        const response = await fetch('/videos');
        const data = await response.json();

        const list = document.getElementById('list');
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<li>No videos available</li>';
            return;
        }

        data.forEach((video) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div>${video.title}</div>
                <button onclick="playVideo(${video.id})">Play</button>
                <button onclick="deleteVideo(${video.id})">Delete</button>
                <button onclick="updateVideo(${video.id}, '${video.title}')">Edit</button>
            `;
            list.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching videos:", error);
    }
}

fetchVideos();
uploadVideo();
