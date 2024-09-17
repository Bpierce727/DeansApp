//This is the .content-box that will contain all the .content-content elements
const contentBox = document.getElementById('content-box');
//This is the array of all the .content-content elements
const contentContents = document.querySelectorAll('.content-content');

var currentContents = [];
var focusContent = [];

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
    //make 2 duplicates on the front and back of the array
    currentContents = [...contentContents, ...contentContents, ...contentContents, ...contentContents, ...contentContents];
    //apply new content to the content box again keeping track of the middle ones
    contentBox.innerHTML = '';
    currentContents.forEach(content => {
        var element = contentBox.appendChild(content.cloneNode(true));
        //get image one and two from children
        const img1 = element.querySelector('.image1');
        const img2 = element.querySelector('.image2');
        //make the images draggable and check for drop
        makeImagesDraggableAndCheck(img1, img2);

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
            const fistVisibleIndex = contentElements.indexOf(firstVisibleElement);
            const offset = firstVisibleElement.getBoundingClientRect().top;
            //the modulus of the first visible index with the length of the focus content will tell us which element it correspnds to to scroll to
            const scrollToIndex = (fistVisibleIndex) % focusContent.length;
            //scroll to the element instnatly seamlessly
            focusContent[scrollToIndex].scrollIntoView({ behavior: 'instant' })
            //now account for offset
            window.scrollBy({ top: -offset, behavior: 'instant' });
    }
}

// Call the quintupleContent function to initialize the content
for (let i = 0; i < 3; i++) {
    quintupleContent();
}

// Add an event listener to update the content on scroll
document.addEventListener('scroll', updateContent);

// Add an event listener to update the content on resize
window.addEventListener('resize', updateContent);
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
        isDragging = true;

        // Prevent default behavior
        e.preventDefault();

        // Remove any transition to allow immediate dragging
        img1.style.transition = 'none';

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

        // Check if img1 overlaps with img2
        const isOverlapping =
            img1Rect.right > img2Rect.left &&
            img1Rect.left < img2Rect.right &&
            img1Rect.bottom > img2Rect.top &&
            img1Rect.top < img2Rect.bottom;

        if (isOverlapping) {
            // Run the overlap callback function if provided
            if (typeof overlapCallback === 'function') {
                overlapCallback();
            }
        } else {
            // Animate back to the original position
            img1.style.transition = 'transform 0.5s ease';
            img1.style.transform = `translate(0px, 0px)`;
        }
    }

    // Attach event listeners to img1
    img1.addEventListener('mousedown', dragStart);
    img1.addEventListener('touchstart', dragStart);

    // Prevent default touch actions like scrolling
    img1.style.touchAction = 'none';

    // Store the initial position
    storeInitialPosition();
}

