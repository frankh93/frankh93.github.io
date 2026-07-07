document.addEventListener("DOMContentLoaded", () => {
    let watchfaceData = []; 
    let categoriesData = [];

    // --- PAGINATION CONFIGURATION ---
    const itemsPerPage = 6;
    let currentPage = 1;
    let currentCategory = "all";

    const gridContainer = document.getElementById("watchface-grid");
    const paginationContainer = document.getElementById("pagination-controls");
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
                currentPage = 1; 
                renderApp();
            });
        });
    }

    // --- CORE LOGIC ---
    function renderApp() {
        const filteredData = watchfaceData.filter(wf => 
            currentCategory === "all" || wf.category === currentCategory
        );

        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);

        gridContainer.innerHTML = pageData.map(wf => {
            const buttonLink = wf.isFree ? wf.amazfacesLink : wf.premiumLink;
            const buttonText = wf.isFree ? '<i class="fa-solid fa-download"></i> Download on Amazfaces' : '<i class="fa-solid fa-cart-shopping"></i> Get Premium Version';
            const buttonClass = wf.isFree ? 'premium-btn free' : 'premium-btn';

            return `
            <div class="wf-card" data-category="${wf.category}">
                
                <div class="card-image loading">
                    <img src="${wf.image}" alt="${wf.title}" onload="this.parentElement.classList.remove('loading')">
                    
                    <div class="wf-drawer">
                        <h4>Main Features</h4>
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
                    <p class="tagline">${wf.tagline}</p>
                </div>
                
            </div>
            `;
        }).join('');

        renderPaginationControls(totalPages);
    }

    function renderPaginationControls(totalPages) {
        paginationContainer.innerHTML = "";
        
        if (totalPages <= 1) return; 

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.classList.add("page-btn");
            if (i === currentPage) btn.classList.add("active");
            btn.innerText = i;
            
            btn.addEventListener("click", () => {
                currentPage = i;
                renderApp();
                document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
            });
            
            paginationContainer.appendChild(btn);
        }
    }

    // --- EVENT LISTENERS ---
    
    // Expandable Drawers (Clickable Text & Overlay Dismiss)
    gridContainer.addEventListener("click", (e) => {
        
        // 1. If the user clicks the blurred overlay (but NOT the button), close it.
        const clickedOverlay = e.target.closest(".wf-drawer");
        const clickedLink = e.target.closest("a");
        if (clickedOverlay && !clickedLink) {
            clickedOverlay.classList.remove("open");
            return;
        }

        // 2. Listen for clicks ANYWHERE on the card
        const currentCard = e.target.closest(".wf-card");
        if (!currentCard) return; // Ignore clicks outside of cards

        const currentDrawer = currentCard.querySelector(".wf-drawer");
        
        // Close all other open drawers first (Accordion effect)
        const allOpenDrawers = gridContainer.querySelectorAll(".wf-drawer.open");
        allOpenDrawers.forEach(drawer => {
            if (drawer !== currentDrawer) {
                drawer.classList.remove("open");
            }
        });

        // Toggle the clicked one
        currentDrawer.classList.toggle("open");
    });
});