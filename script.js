document.addEventListener("DOMContentLoaded", () => {
    let watchfaceData = []; 
    let categoriesData = [];

    const gridContainer = document.getElementById("watchface-grid");
    const backToTopBtn = document.getElementById("back-to-top");

    // --- PRO SCROLL TO TOP ---
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", (e) => {
            e.preventDefault(); 
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // --- ANIMATION ENGINE VARIABLES ---
    let currentX = 0;
    let targetX = 0;
    let isPaused = false;
    let isCentering = false;
    let groupWidth = 0;
    let animationId;
    let lastTime = 0; 
    
    const marqueeSpeed = 190; 

    // --- SHUFFLE & SORT LOGIC ---
    // Standard Fisher-Yates shuffle for arrays
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Groups watchfaces by model, shuffles them, then alternates them
    function randomizeWatchfaces(data) {
        const groups = {};
        
        // Group all watchfaces by their category (watch model)
        data.forEach(wf => {
            if (!groups[wf.category]) groups[wf.category] = [];
            groups[wf.category].push(wf);
        });

        // Shuffle the items inside each individual category
        Object.values(groups).forEach(group => shuffleArray(group));

        const randomizedData = [];
        let itemsRemaining = true;
        
        // Pull one item from each category in a loop until all are empty
        while (itemsRemaining) {
            itemsRemaining = false;
            for (const category in groups) {
                if (groups[category].length > 0) {
                    randomizedData.push(groups[category].pop());
                    itemsRemaining = true;
                }
            }
        }
        
        return randomizedData;
    }

    // --- FETCH BOTH JSON FILES ---
    Promise.all([
        fetch('./watches.json').then(res => res.json()),
        fetch('./watchfaces.json').then(res => res.json())
    ])
    .then(([categories, watchfaces]) => {
        categoriesData = categories;
        // Pass the raw data through the randomizer before saving it
        watchfaceData = randomizeWatchfaces(watchfaces); 
        renderApp();      
    })
    .catch(error => console.error('Error loading data:', error));

    // --- CORE LOGIC ---
    function renderApp() {
        const itemsHTML = watchfaceData.map(wf => {
            const buttonLink = wf.isFree ? wf.amazfacesLink : wf.premiumLink;
            const buttonText = wf.isFree ? '<i class="fa-solid fa-download"></i> Download' : '<i class="fa-solid fa-cart-shopping"></i> Get Premium Version';
            const buttonClass = wf.isFree ? 'premium-btn free' : 'premium-btn';
            
            const watchModel = categoriesData.find(cat => cat.id === wf.category)?.name || wf.category;

            return `
            <div class="wf-card" data-category="${wf.category}">
                <div class="card-image loading">
                    <img src="${import.meta.env.BASE_URL}images/${wf.image}" alt="${wf.title}" onload="this.parentElement.classList.remove('loading')">
                    
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

        // Inject 6 groups to create a massive invisible buffer
        gridContainer.innerHTML = `
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group">${itemsHTML}</div>
        `;

        setTimeout(() => {
            updateDimensions();
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

    // --- JS DELTA-TIME ANIMATION ENGINE ---
    function startMarquee() {
        if (animationId) cancelAnimationFrame(animationId);
        lastTime = performance.now(); 

        function loop(currentTime) {
            const dt = currentTime - lastTime;
            lastTime = currentTime;
            const safeDt = Math.min(dt, 50); 

            if (!isPaused && !isCentering) {
                currentX -= (marqueeSpeed * safeDt) / 1000;
                targetX = currentX;
            } else if (isCentering) {
                currentX += (targetX - currentX) * 0.1;
                if (Math.abs(targetX - currentX) < 0.5) {
                    currentX = targetX;
                    isCentering = false;
                }
            }

            if (groupWidth > 0) {
                if (currentX <= -(groupWidth * 3)) {
                    currentX += groupWidth;
                    targetX += groupWidth;
                } else if (currentX >= -groupWidth) {
                    currentX -= groupWidth;
                    targetX -= groupWidth;
                }
            }

            gridContainer.style.transform = `translateX(${currentX}px)`;
            animationId = requestAnimationFrame(loop);
        }
        animationId = requestAnimationFrame(loop);
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

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".watchface-grid")) {
            const allOpenDrawers = gridContainer.querySelectorAll(".wf-drawer.open");
            if (allOpenDrawers.length > 0) {
                allOpenDrawers.forEach(drawer => drawer.classList.remove("open"));
                checkDrawerState();
            }
        }
    });

    function checkDrawerState() {
        const openDrawer = gridContainer.querySelector(".wf-drawer.open");
        
        if (openDrawer) {
            isPaused = true;
        } else {
            const isHoveringCard = gridContainer.querySelector(".wf-card:hover");
            if (isHoveringCard && window.matchMedia("(hover: hover)").matches) {
                isPaused = true;
            } else {
                isPaused = false;
                isCentering = false;
                targetX = currentX;
            }
        }
    }
});