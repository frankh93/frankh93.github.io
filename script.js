document.addEventListener("DOMContentLoaded", () => {
    let watchfaceData = []; 
    let categoriesData = [];

    const gridContainer = document.getElementById("watchface-grid");

    // --- ANIMATION ENGINE VARIABLES ---
    let currentX = 0;
    let targetX = 0;
    let isPaused = false;
    let isCentering = false;
    let groupWidth = 0;
    let animationId;
    
    // Adjust this to change the scrolling speed (pixels per frame)
    const marqueeSpeed = 1.25; 

    // --- FETCH BOTH JSON FILES ---
    Promise.all([
        fetch('./watches.json').then(res => res.json()),
        fetch('./watchfaces.json').then(res => res.json())
    ])
    .then(([categories, watchfaces]) => {
        categoriesData = categories;
        watchfaceData = watchfaces; 
        renderApp();      
    })
    .catch(error => console.error('Error loading data:', error));

    // --- CORE LOGIC ---
    function renderApp() {
        const itemsHTML = watchfaceData.map(wf => {
            const buttonLink = wf.isFree ? wf.amazfacesLink : wf.premiumLink;
            const buttonText = wf.isFree ? '<i class="fa-solid fa-download"></i> Download' : '<i class="fa-solid fa-cart-shopping"></i> Get Premium';
            const buttonClass = wf.isFree ? 'premium-btn free' : 'premium-btn';
            
            const watchModel = categoriesData.find(cat => cat.id === wf.category)?.name || wf.category;

            return `
            <div class="wf-card" data-category="${wf.category}">
                <div class="card-image loading">
                    <img src="${wf.image}" alt="${wf.title}" onload="this.parentElement.classList.remove('loading')">
                    
                    <div class="wf-drawer">
                        <h4><b><u>Features</u></b></h4>
                        <ul>
                            ${wf.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                        <a href="${buttonLink}" target="_blank" class="${buttonClass}">
                            ${buttonText}
                        </a>
                    </div>
                </div>
                
                <div class="card-content clickable-area">
                    <h3>${wf.title}</h3>
                    <div class="compatibility">
                        <span>${watchModel}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Inject 6 groups to create a massive invisible buffer on both sides of the screen.
        // This guarantees the loop never breaks, even when aggressively shifting the track.
        gridContainer.innerHTML = `
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
        `;

        // Wait a split second for the DOM and images to render so we can measure the track
        setTimeout(() => {
            updateDimensions();
            // Start the marquee in the middle of our 6 groups
            currentX = -(groupWidth * 2);
            targetX = currentX;
            startMarquee();
        }, 150);
    }

    function updateDimensions() {
        const group = gridContainer.querySelector('.marquee-group');
        if (group) groupWidth = group.offsetWidth;
    }
    window.addEventListener('resize', updateDimensions);

    // --- JS ANIMATION ENGINE ---
    function startMarquee() {
        if (animationId) cancelAnimationFrame(animationId);

        function loop() {
            if (!isPaused && !isCentering) {
                // Normal scrolling
                currentX -= marqueeSpeed;
                targetX = currentX;
            } else if (isCentering) {
                // Smooth slide to the centered target
                currentX += (targetX - currentX) * 0.1;
                // Once it reaches the center, stop the slide animation
                if (Math.abs(targetX - currentX) < 0.5) {
                    currentX = targetX;
                    isCentering = false;
                }
            }

            // Infinite Looping Math
            if (groupWidth > 0) {
                // If it scrolls too far left, jump back seamlessly
                if (currentX <= -(groupWidth * 3)) {
                    currentX += groupWidth;
                    targetX += groupWidth;
                } 
                // If we shifted it too far right, jump forward seamlessly
                else if (currentX >= -groupWidth) {
                    currentX -= groupWidth;
                    targetX -= groupWidth;
                }
            }

            gridContainer.style.transform = `translateX(${currentX}px)`;
            animationId = requestAnimationFrame(loop);
        }
        loop();
    }

    // --- EVENT LISTENERS (DRAWER CONTROLS) ---
    gridContainer.addEventListener("click", (e) => {
        const clickedOverlay = e.target.closest(".wf-drawer");
        const clickedLink = e.target.closest("a");
        
        if (clickedOverlay && !clickedLink) {
            clickedOverlay.classList.remove("open");
            checkDrawerState();
            return;
        }

        const currentCard = e.target.closest(".wf-card");
        if (!currentCard) return; 

        const currentDrawer = currentCard.querySelector(".wf-drawer");
        
        const allOpenDrawers = gridContainer.querySelectorAll(".wf-drawer.open");
        allOpenDrawers.forEach(drawer => {
            if (drawer !== currentDrawer) {
                drawer.classList.remove("open");
            }
        });

        if (currentDrawer) {
            const isOpen = currentDrawer.classList.toggle("open");
            if (isOpen) {
                isPaused = true;
                
                // If on mobile, calculate distance and trigger the slide engine
                if (window.innerWidth <= 768) {
                    const rect = currentCard.getBoundingClientRect();
                    const cardCenter = rect.left + (rect.width / 2);
                    const screenCenter = window.innerWidth / 2;
                    const offset = screenCenter - cardCenter;

                    targetX = currentX + offset;
                    isCentering = true;
                }
            } else {
                checkDrawerState();
            }
        }
    });

    // Handle Mouse Hover Pausing (Desktop)
    gridContainer.addEventListener("mouseover", (e) => {
        if (e.target.closest(".wf-card") && window.matchMedia("(hover: hover)").matches) {
            isPaused = true;
        }
    });

    gridContainer.addEventListener("mouseout", (e) => {
        const currentCard = e.target.closest(".wf-card");
        if (currentCard) {
            if (!currentCard.contains(e.relatedTarget)) {
                const openDrawer = currentCard.querySelector(".wf-drawer.open");
                if (openDrawer) {
                    openDrawer.classList.remove("open");
                }
                checkDrawerState();
            }
        }
    });

    // Handle Outside Clicks
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".watchface-grid")) {
            const allOpenDrawers = gridContainer.querySelectorAll(".wf-drawer.open");
            if (allOpenDrawers.length > 0) {
                allOpenDrawers.forEach(drawer => drawer.classList.remove("open"));
                checkDrawerState();
            }
        }
    });

    // --- STATE MANAGER ---
    function checkDrawerState() {
        const openDrawer = gridContainer.querySelector(".wf-drawer.open");
        
        if (openDrawer) {
            isPaused = true;
        } else {
            // Check if the user is still hovering over a card on a desktop before unpausing
            const isHoveringCard = gridContainer.querySelector(".wf-card:hover");
            if (isHoveringCard && window.matchMedia("(hover: hover)").matches) {
                isPaused = true;
            } else {
                // Unpause and seamlessly resume from current position
                isPaused = false;
                isCentering = false;
                targetX = currentX;
            }
        }
    }
});