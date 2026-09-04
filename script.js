document.addEventListener("DOMContentLoaded", () => {
    let watchfaceData = []; 
    let categoriesData = [];
    let currentCategory = "all";

    const gridContainer = document.getElementById("watchface-grid");
    const filterBar = document.querySelector(".filter-bar");

    // --- FETCH BOTH JSON FILES ---
    Promise.all([
        fetch('./watches.json').then(res => res.json()),
        fetch('./watchfaces.json').then(res => res.json())
    ])
    .then(([categories, watchfaces]) => {
        categoriesData = categories;
        watchfaceData = watchfaces; 
        
        renderFilters(); // Draw the buttons first
        renderApp();     // Then draw the watchfaces     
    })
    .catch(error => console.error('Error loading data:', error));

    // --- RENDER FILTER BUTTONS ---
    function renderFilters() {
        filterBar.innerHTML = categoriesData.map(cat => 
            `<button class="filter-btn ${cat.id === currentCategory ? 'active' : ''}" data-filter="${cat.id}">${cat.name}</button>`
        ).join('');

        // Attach click events to the newly created buttons
        const filterButtons = document.querySelectorAll(".filter-btn");
        filterButtons.forEach(button => {
            button.addEventListener("click", () => {
                filterButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                
                currentCategory = button.getAttribute("data-filter");
                renderApp();
                
                // Snap carousel back to the start when a new filter is clicked
                gridContainer.scrollTo({ left: 0, behavior: 'smooth' });
            });
        });
    }

    // --- CORE LOGIC ---
    function renderApp() {
        const filteredData = watchfaceData.filter(wf => 
            currentCategory === "all" || wf.category === currentCategory
        );

        gridContainer.innerHTML = filteredData.map(wf => {
            const buttonLink = wf.isFree ? wf.amazfacesLink : wf.premiumLink;
            const buttonText = wf.isFree ? '<i class="fa-solid fa-download"></i> Download on Amazfaces' : '<i class="fa-solid fa-cart-shopping"></i> Get Premium Version';
            const buttonClass = wf.isFree ? 'premium-btn free' : 'premium-btn';

            // Find the human-readable watch model name from categoriesData
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
    }
    // --- AUTO SCROLL LOGIC ---
    let autoScrollInterval;

    function startAutoScroll() {
        clearInterval(autoScrollInterval); // Prevent multiple intervals
        autoScrollInterval = setInterval(() => {
            cycleCarousel();
        }, 5000); // 5 seconds
    }

    function cycleCarousel() {
        const firstCard = gridContainer.firstElementChild;
        if (!firstCard) return;

        // Calculate dynamic scroll amount (Card width + CSS gap)
        const cardWidth = firstCard.offsetWidth;
        const gap = parseInt(window.getComputedStyle(gridContainer).gap) || 0;
        const scrollAmount = cardWidth + gap;

        // 1. Smoothly scroll to the next card
        gridContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });

        // 2. Wait for the scroll animation to finish (approx 500ms)
        setTimeout(() => {
            // Temporarily disable smooth scrolling
            gridContainer.classList.add("no-smooth");
            
            // Move the first card to the end of the list
            gridContainer.appendChild(firstCard);
            
            // Instantly adjust the scroll position back so the screen doesn't jump
            gridContainer.scrollLeft -= scrollAmount;
            
            // Force the browser to register the changes (DOM Reflow)
            void gridContainer.offsetWidth; 
            
            // Re-enable smooth scrolling for the next cycle
            gridContainer.classList.remove("no-smooth");
        }, 500); 
    }

    function stopAutoScroll() {
        clearInterval(autoScrollInterval);
    }

    // Start auto-scroll after the app renders
    renderApp(); 
    startAutoScroll();

    // --- EVENT LISTENERS ---

    // Pause auto-scroll on hover or touch so users can read the details
    gridContainer.addEventListener("mouseenter", stopAutoScroll);
    gridContainer.addEventListener("touchstart", stopAutoScroll, { passive: true });
    
    // Resume auto-scroll when they leave, UNLESS a drawer is currently open
    gridContainer.addEventListener("mouseleave", () => {
        if (!gridContainer.querySelector(".wf-drawer.open")) startAutoScroll();
    });
    gridContainer.addEventListener("touchend", () => {
        if (!gridContainer.querySelector(".wf-drawer.open")) startAutoScroll();
    });

    // Expandable Drawers (Clickable Text & Overlay Dismiss)
    gridContainer.addEventListener("click", (e) => {
        const clickedOverlay = e.target.closest(".wf-drawer");
        const clickedLink = e.target.closest("a");
        
        if (clickedOverlay && !clickedLink) {
            clickedOverlay.classList.remove("open");
            startAutoScroll(); // Resume scrolling when drawer closes
            return;
        }

        const currentCard = e.target.closest(".wf-card");
        if (!currentCard) return; 

        const currentDrawer = currentCard.querySelector(".wf-drawer");
        
        // Close all other open drawers first
        const allOpenDrawers = gridContainer.querySelectorAll(".wf-drawer.open");
        allOpenDrawers.forEach(drawer => {
            if (drawer !== currentDrawer) {
                drawer.classList.remove("open");
            }
        });

        if (currentDrawer) {
            const isOpen = currentDrawer.classList.toggle("open");
            // Stop scroll if opened, resume if closed
            if (isOpen) {
                stopAutoScroll(); 
            } else {
                startAutoScroll(); 
            }
        }
    });
});