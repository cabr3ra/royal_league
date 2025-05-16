document.addEventListener('DOMContentLoaded', function () {
    // Section: "Who I Am" Presentation
    function presentWhoIAm(info) {
        const container = document.getElementById('presentation-container');
        const image = document.getElementById('presentation-image');
        const title = document.getElementById('presentation-title');
        const description1 = document.getElementById('presentation-description1');
        const description2 = document.getElementById('presentation-description2');
        const description3 = document.getElementById('presentation-description3');

        // Populate the content
        image.src = info.image;
        image.alt = info.name;
        title.textContent = info.name;
        description1.textContent = info.description1;
        description2.textContent = info.description2;
        description3.textContent = info.description3;

        // Add animation classes
        container.classList.remove('hidden');
        container.classList.add('fade-in');
    }

    // Example information for "Who I Am"
    const myInfo = {
        name: "Oriol Cabrera",
        description1: "Hi! I'm a programmer and I created Royal League.",
        description2: "If you ask me what a bouncing tomato does, I wouldn't know how to answer you, but if you like the Kings League, here you can play minigames created by me.",
        description3: "I hope you have fun!",
        image: "/static/img/me.png"
    };

    // Call the function to present "Who I Am"
    presentWhoIAm(myInfo);

    // Section: Tomato Animation with Physics
    const tomato = document.getElementById('tomato');
    const container = document.getElementById('tomato-container');

    // Physics variables
    let velocityX = 3; // Horizontal velocity
    let velocityY = 3; // Vertical velocity
    const gravity = 0.3; // Gravity effect
    const damping = 0.9; // Damping factor for bounce
    let positionX = 0; // Initial horizontal position
    let positionY = 0; // Initial vertical position

    // Function to update the tomato's position with physics
    function updateTomatoPosition() {
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const tomatoWidth = tomato.offsetWidth;
        const tomatoHeight = tomato.offsetHeight;

        // Update positions based on velocity
        positionX += velocityX;
        positionY += velocityY;

        // Apply gravity
        velocityY += gravity;

        // Bounce off the walls
        if (positionX + tomatoWidth > containerWidth || positionX < 0) {
            velocityX = -velocityX * damping; // Reverse and dampen horizontal velocity
            positionX = Math.max(0, Math.min(positionX, containerWidth - tomatoWidth)); // Keep within bounds
        }

        if (positionY + tomatoHeight > containerHeight || positionY < 0) {
            velocityY = -velocityY * damping; // Reverse and dampen vertical velocity
            positionY = Math.max(0, Math.min(positionY, containerHeight - tomatoHeight)); // Keep within bounds
        }

        // Apply the new position
        tomato.style.transform = `translate(${positionX}px, ${positionY}px)`;

        // Request the next animation frame
        requestAnimationFrame(updateTomatoPosition);
    }

    // Start the animation
    updateTomatoPosition();
});