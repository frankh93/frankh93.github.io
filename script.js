document.addEventListener("DOMContentLoaded", () => {
    let watchfaceData = []; 
    let categoriesData = [];

    const gridContainer = document.getElementById("watchface-grid");

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

    // --- CORE LOGIC (CONTINUOUS MARQUEE) ---
    function renderApp() {
        const itemsHTML = watchfaceData.map(wf => {
            const buttonLink = wf.isFree ? wf.amazfacesLink : wf.premiumLink;
            const buttonText = wf.isFree ? '<i class="fa-solid fa-download"></i> Download on Amazfaces' : '<i class="fa-solid fa-cart-shopping"></i> Get Premium Version';
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

        gridContainer.innerHTML = `
            <div class="marquee-group">${itemsHTML}</div>
            <div class="marquee-group" aria-hidden="true">${itemsHTML}</div>
            <div class="marquee-group" aria-hidden="true">${itemsHTML}</div>
            <div class="marquee-group" aria-hidden="true">${itemsHTML}</div>
        `;
    }

    // --- EVENT LISTENERS (DRAWER CONTROLS) ---
    
    // 1. Handle Clicks (Opening drawers)
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
            currentDrawer.classList.toggle("open");
            checkDrawerState();
        }
    });

    // 2. Handle Mouse Leave (Desktop auto-close)
    gridContainer.addEventListener("mouseout", (e) => {
        const currentCard = e.target.closest(".wf-card");
        
        if (currentCard) {
            // e.relatedTarget is where the mouse is moving TO.
            // If the mouse is moving outside of this specific card, close its drawer.
            if (!currentCard.contains(e.relatedTarget)) {
                const openDrawer = currentCard.querySelector(".wf-drawer.open");
                if (openDrawer) {
                    openDrawer.classList.remove("open");
                    checkDrawerState();
                }
            }
        }
    });

    // 3. Handle Outside Clicks (Mobile & Desktop safeguard)
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
        if (gridContainer.querySelector(".wf-drawer.open")) {
            gridContainer.style.animationPlayState = 'paused';
        } else {
            gridContainer.style.animationPlayState = ''; 
        }
    }
});