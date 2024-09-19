//This is the .content-box that will contain all the .content-content elements
const contentBox = document.getElementById('content-box');


var currentContents = [];
var focusContent = [];

var voiceToUse = 0;

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
    var content = document.getElementById("content-content");
    
    //get ./Content.json
    try {
        fetch('./Content.json')
            .then(response => response.json())
            .then(data => {
                //for each object in the json
                data.forEach(obj => {
                    console.log(obj);

                    //create a new content element
                    var newContent = content.cloneNode(true);

                    //remove ID and hidden attributes
                    newContent.removeAttribute("id");
                    newContent.removeAttribute("hidden");
                    //set the title to the title in the json
                    newContent.querySelector(".title").innerText = obj.text;
                    //set image1 to the image1 in the json
                    newContent.querySelector(".image1").src = obj.image1;
                    //set image2 to the image2 in the json
                    newContent.querySelector(".image2").src = obj.image2;

                    //append the new content to the content box
                    contentBox.appendChild(newContent);
                });
                //remove the original content element
                content.remove();
                //quintuple the content
                quintupleContent();
                
                // Add an event listener to update the content on scroll
                document.addEventListener('scroll', updateContent);

                // Add an event listener to update the content on resize
                window.addEventListener('resize', updateContent);
                updateContent();
            });
    } catch (error) {
        console.error(error);
    }
}

function speakWords(text) {
    //get all the voices
    var voices = window.speechSynthesis.getVoices();
    //create a new speech synthesis utterance
    var msg = new SpeechSynthesisUtterance();
    //set the text to the text passed in
    msg.text = text;
    //set the voice to the voiceToUse
    msg.voice = voices[voiceToUse];
    //speak the text
    window.speechSynthesis.speak(msg);
    //return the message
    return msg;
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
    voiceSelect.value = voiceToUse;
    //add an event listener to the select element
    voiceSelect.onchange = function() {
        voiceToUse = voiceSelect.value;
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

createContent();
