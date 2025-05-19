// Configuration object for global settings
const CONFIG = {
    voiceToUse: 0,
    overlapDistance: 250,
    animationDuration: '0.5s',
    animationEasing: 'ease'
};

//This is the .content-box that will contain all the .content-content elements
const contentBox = document.getElementById('content-box');

// DOM Elements
let currentContents = [];
let focusContent = [];

// Utility functions
const getTranslateValues = (element) => {
    const style = window.getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return { x: matrix.m41, y: matrix.m42 };
};

const applyTransform = (element, x, y, scale = 1) => {
    element.style.transition = `transform ${CONFIG.animationDuration} ${CONFIG.animationEasing}`;
    element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
};

const resetTransform = (element) => {
    applyTransform(element, 0, 0);
};

function isOffscreen(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.bottom < 0 ||
        rect.right < 0 ||
        rect.left > window.innerWidth ||
        rect.top > window.innerHeight
    );
}

function quintupleContent() {
    //This is the array of all the .content-content elements
    const contentContents = document.querySelectorAll('.content-content');
    //make 2 duplicates on the front and back of the array
    currentContents = [...contentContents, ...contentContents, ...contentContents, ...contentContents, ...contentContents];
    //apply new content to the content box again keeping track of the middle ones
    contentBox.innerHTML = '';
    currentContents.forEach(content => {
        var element = contentBox.appendChild(content.cloneNode(true));
        //get image one and two from children
        const img1 = element.querySelector('.image1');
        const img2 = element.querySelector('.image2');
        const text = element.querySelector('.title').innerText;
        //make the images draggable and check for drop
        makeImagesDraggableAndCheck(img1, img2, speakWords.bind(null, text));
    });
    focusContent = contentBox.children;
    focusContent = Array.from(focusContent).slice(Math.floor(focusContent.length * 2 / 5), Math.floor(focusContent.length * 3 / 5));
}

function updateContent() {
    //log that this is updating
    //console.log('Updating content...');
    //check if the focusContent is offscreen
    if (focusContent.some(isOffscreen)) {
            //scroll the window to exactly match, to do this first we find the elements visible on the screen
            const contentElements = Array.from(contentBox.children)
            //find the first visible element
            const firstVisibleElement = contentElements.find(element => !isOffscreen(element));
            //if we found one, we will need to know which in the list it is, and its offset from the top of the screen
            const firstVisibleIndex = contentElements.indexOf(firstVisibleElement);
            const offset = firstVisibleElement.getBoundingClientRect().top;
            const scrollToIndex = firstVisibleIndex % focusContent.length;
            const targetElement = focusContent[scrollToIndex];
            const targetRect = targetElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset + targetRect.top - offset;

            // Scroll to the exact position
            window.scrollTo({ top: scrollTop, behavior: 'instant' });
    }
}

function makeImagesDraggableAndCheck(img1, img2, overlapCallback) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let initialTransform = { x: 0, y: 0 };
    let initialPosition = { x: 0, y: 0 };

    // Function to get the current transform values
    function getTranslateValues(element) {
        const style = window.getComputedStyle(element);
        const matrix = new DOMMatrixReadOnly(style.transform);
        return { x: matrix.m41, y: matrix.m42 };
    }

    // Store the initial position
    function storeInitialPosition() {
        const rect = img1.getBoundingClientRect();
        initialPosition.x = rect.left + window.scrollX;
        initialPosition.y = rect.top + window.scrollY;
    }

    // Function to handle the start of a drag (mouse or touch)
    function dragStart(e) {
        img2.removeAttribute("hidden");

        isDragging = true;

        // Prevent default behavior
        e.preventDefault();

        // Remove any transition to allow immediate dragging
        img1.style.transition = 'none';

        //put image on top of all other images
        img1.style.zIndex = 10;

        // Get initial mouse/touch position
        const event = e.type.includes('touch') ? e.touches[0] : e;
        startX = event.clientX;
        startY = event.clientY;

        // Get the current transform values
        initialTransform = getTranslateValues(img1);

        // Add event listeners for moving and ending the drag
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchmove', dragMove);
        document.addEventListener('touchend', dragEnd);
        document.addEventListener('touchcancel', dragEnd);
    }

    // Function to handle the movement during a drag (mouse or touch)
    function dragMove(e) {
        if (!isDragging) return;

        // Prevent default behavior
        e.preventDefault();

        const event = e.type.includes('touch') ? e.touches[0] : e;

        // Calculate the distance moved
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        // Update the current position
        currentX = initialTransform.x + dx;
        currentY = initialTransform.y + dy;

        // Apply the transform
        img1.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    // Function to handle the end of a drag (mouse or touch)
    function dragEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        // Remove event listeners
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchmove', dragMove);
        document.removeEventListener('touchend', dragEnd);
        document.removeEventListener('touchcancel', dragEnd);

        // Get the bounding rectangle of img1 after movement
        const img1Rect = img1.getBoundingClientRect();
        const img2Rect = img2.getBoundingClientRect();

        // Check if img1 overlaps closely with img2 (check the distance between the centers)
        const img1CenterX = img1Rect.left + img1Rect.width / 2;
        const img1CenterY = img1Rect.top + img1Rect.height / 2;
        const img2CenterX = img2Rect.left + img2Rect.width / 2;
        const img2CenterY = img2Rect.top + img2Rect.height / 2;
        const distance = Math.sqrt( 
            Math.pow(img1CenterX - img2CenterX, 2) + Math.pow(img1CenterY - img2CenterY, 2)
        );

        const isOverlapping = distance < 250;

        if (isOverlapping) {
            // Run the overlap callback function if provided
            if (typeof overlapCallback === 'function') {
                //calculate the center of the viewport then move the center of the image to that
                const viewportCenterX = window.innerWidth / 2;
                const viewportCenterY = window.innerHeight / 2;
                const dx = (viewportCenterX - img1CenterX) * -1;
                const dy = viewportCenterY - img1CenterY;
                //calculate max size modifier that the image can be and still fit in the viewport
                const maxSize = Math.min(window.innerWidth / img1Rect.width, window.innerHeight / img1Rect.height);
                //move the image to the center of the viewport and scale it to fit
                img1.style.transition = 'transform 0.5s ease';
                img1.style.transform = `translate(${dx}px, ${dy}px) scale(${maxSize})`;
                // Speak the text
                var msg = overlapCallback();
                // Wait for the speech to finish before animating back
                msg.onend = () => {
                    // Animate back to the original position
                    img1.style.transition = 'transform 0.5s ease';
                    img1.style.transform = `translate(0px, 0px)`;
                    img1.style.zIndex = 0;
                };
            }
        } else {
            // Animate back to the original position
            img1.style.transition = 'transform 0.5s ease';
            img1.style.transform = `translate(0px, 0px)`;
            //wait for the animation to finish
        }
        img2.setAttribute("hidden", true);
    }

    // Attach event listeners to img1
    img1.addEventListener('mousedown', dragStart);
    img1.addEventListener('touchstart', dragStart);

    // Prevent default touch actions like scrolling
    img1.style.touchAction = 'none';

    // Store the initial position
    storeInitialPosition();
}

function createContent() {
    const content = document.getElementById("content-content");
    
    fetch('./Content.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(obj => {
                const newContent = content.cloneNode(true);
                newContent.removeAttribute("id");
                newContent.removeAttribute("hidden");
                
                const title = newContent.querySelector(".title");
                const img1 = newContent.querySelector(".image1");
                const img2 = newContent.querySelector(".image2");
                
                title.innerText = obj.text;
                img1.src = obj.image1;
                img2.src = obj.image2;
                
                // Add accessibility attributes
                img1.alt = `${obj.text} - Interactive image`;
                img2.alt = `${obj.text} - Target image`;
                newContent.setAttribute('role', 'article');
                newContent.setAttribute('aria-label', obj.text);
                
                contentBox.appendChild(newContent);
            });
            
            content.remove();
            quintupleContent();
            
            // Add debounced event listeners
            const debouncedUpdate = debounce(updateContent, 100);
            document.addEventListener('scroll', debouncedUpdate);
            window.addEventListener('resize', debouncedUpdate);
            updateContent();
        })
        .catch(error => {
            console.error('Error loading content:', error);
            // Add user-friendly error message
            contentBox.innerHTML = '<div class="error-message">Failed to load content. Please try refreshing the page.</div>';
        });
}

function speakWords(text) {
    return new Promise((resolve, reject) => {
        try {
            const voices = window.speechSynthesis.getVoices();
            const msg = new SpeechSynthesisUtterance();
            msg.text = text;
            msg.voice = voices[CONFIG.voiceToUse];
            
            msg.onend = () => resolve(msg);
            msg.onerror = (error) => reject(error);
            
            window.speechSynthesis.speak(msg);
        } catch (error) {
            reject(error);
        }
    });
}

function openMenu() {
    //create a menu element
    var menu = document.createElement("div");
    //make the menu act as a floating popup window
    menu.style.position = "fixed";
    menu.style.top = "50%";
    menu.style.left = "50%";
    menu.style.transform = "translate(-50%, -50%)";
    menu.style.backgroundColor = "white";
    menu.style.border = "1px solid black";
    menu.style.padding = "10px";
    menu.style.zIndex = "1000";
    //create a close button
    var closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.onclick = function() {
        menu.remove();
    };

    //create a select element
    var voiceSelect = document.createElement("select");
    //set width to reasonable size
    voiceSelect.style.width = "200px";
    //get all the voices
    var voices = window.speechSynthesis.getVoices();
    //for each voice
    voices.forEach((voice, index) => {
        //create an option element
        var option = document.createElement("option");
        //set the value to the index
        option.value = index;
        //set the text to the voice name
        option.innerText = voice.name;
        //append the option to the select element
        voiceSelect.appendChild(option);
    });
    //set the select element to the voiceToUse
    voiceSelect.value = CONFIG.voiceToUse;
    //add an event listener to the select element
    voiceSelect.onchange = function() {
        CONFIG.voiceToUse = voiceSelect.value;
    };
    //append the select element to the menu
    menu.appendChild(voiceSelect);

    //create a slider for the height of content
    var heightSlider = document.createElement("input");
    heightSlider.type = "range";
    heightSlider.min = "10";
    heightSlider.max = "100";
    heightSlider.value = "20";
    heightSlider.style.width = "200px";
    //set content-content and img height to the value as "calc(" + heightSlider.value + "vh - 40px")
    heightSlider.oninput = function() {
        document.querySelectorAll(".content-content").forEach(content => {
            content.style.height = "calc(" + heightSlider.value + "vh - 40px)";
            });
        document.querySelectorAll("img").forEach(img => {
            img.style.height = "calc(" + heightSlider.value + "vh - 40px)";
            });
    };
    //append the slider to the menu
    menu.appendChild(heightSlider);

    
    //append the close button to the menu
    menu.appendChild(closeButton);
    //append the menu to the body
    document.body.appendChild(menu);
}

//call openMenu when the key combo "ctrl + m" is pressed
document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "m") {
        openMenu();
    }
});

function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

//call requestFullscreen  when any touch event is detected
document.addEventListener("touchstart", requestFullscreen);
document.addEventListener("touchend", requestFullscreen);
document.addEventListener("touchmove", requestFullscreen);
document.addEventListener("click", requestFullscreen);

createContent();

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
