/**
 * script.js
 * JavaScript functionality for Diana Kozachek's portfolio website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality when DOM is fully loaded
    initSmoothScrolling();
    initDynamicBackground();
    initFormHandling();
    initSectionHighlighting();
    initDarkModeToggle();
});

/**
 * Smooth scrolling for navigation links
 */
function initSmoothScrolling() {
    // Get all links that have hash (#) in them
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only if the link points to an element on this page
            if(this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if(targetId === '#') return; // Skip if it's just "#"
                
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    // Smooth scroll to the element
                    window.scrollTo({
                        top: targetElement.offsetTop - 100, // Offset for header
                        behavior: 'smooth'
                    });
                    
                    // Update URL without page reload
                    history.pushState(null, null, targetId);
                }
            }
        });
    });
}

/**
 * Dynamic background image changer
 * Based on the original implementation from the provided HTML
 */
function initDynamicBackground() {
    // List of all background image URLs
    const imageUrls = [
        "https://raw.githubusercontent.com/koizachek/koizachek.github.io/aiportraits/background3.JPG",
        "https://raw.githubusercontent.com/koizachek/koizachek.github.io/aiportraits/background5.JPG",
        "https://raw.githubusercontent.com/koizachek/koizachek.github.io/aiportraits/background6.JPG",
        "https://raw.githubusercontent.com/koizachek/koizachek.github.io/aiportraits/background7.JPG",
        "https://raw.githubusercontent.com/koizachek/koizachek.github.io/aiportraits/background8.JPG"
    ];
    
    // Function to set a random background
    function setRandomBackground() {
        const randomIndex = Math.floor(Math.random() * imageUrls.length);
        const randomImageUrl = imageUrls[randomIndex];
        
        // Create a new image to preload
        const img = new Image();
        img.onload = function() {
            // Once loaded, apply it with a fade effect
            document.body.style.backgroundImage = `url('${randomImageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
        };
        img.src = randomImageUrl;
    }
    
    // Set initial background
    setRandomBackground();
    
    // Change background every 30 seconds
    setInterval(setRandomBackground, 30000);
    
    // Add a subtle overlay to ensure text readability
    const overlay = document.createElement('div');
    overlay.classList.add('background-overlay');
    document.body.appendChild(overlay);
}

/**
 * Form handling for the contact form
 */
function initFormHandling() {
    const form = document.getElementById('emailForm');
    
    if(form) {
        form.addEventListener('submit', function(e) {
            // We're using mailto: so we don't need to prevent default
            // But we can add some visual feedback
            
            const submitBtn = form.querySelector('.submit-btn');
            if(submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Sending...';
                
                // Reset button text after a delay (simulating sending)
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                }, 2000);
            }
        });
    }
}

/**
 * Highlight active section based on scroll position
 */
function initSectionHighlighting() {
    const sections = document.querySelectorAll('.section');
    
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if(scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                // Add active class to current section
                section.classList.add('active-section');
                
                // Update section number color
                const sectionNumber = section.querySelector('.section-number');
                if(sectionNumber) {
                    sectionNumber.style.color = 'var(--color-accent)';
                }
            } else {
                // Remove active class from other sections
                section.classList.remove('active-section');
                
                // Reset section number color
                const sectionNumber = section.querySelector('.section-number');
                if(sectionNumber) {
                    sectionNumber.style.color = 'var(--color-text-light)';
                }
            }
        });
    });
}

/**
 * Toggle between light and dark mode
 */
function initDarkModeToggle() {
    // Create dark mode toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.classList.add('dark-mode-toggle');
    toggleBtn.innerHTML = '☀️';
    toggleBtn.title = 'Toggle Dark/Light Mode';
    
    // Add button to the DOM
    document.body.appendChild(toggleBtn);
    
    // Style the button
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.bottom = '20px';
    toggleBtn.style.right = '20px';
    toggleBtn.style.width = '40px';
    toggleBtn.style.height = '40px';
    toggleBtn.style.borderRadius = '50%';
    toggleBtn.style.backgroundColor = 'var(--color-accent)';
    toggleBtn.style.color = 'var(--color-text-inverse)';
    toggleBtn.style.border = 'none';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontSize = '20px';
    toggleBtn.style.display = 'flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.zIndex = '1000';
    toggleBtn.style.transition = 'all 0.3s ease';
    
    // Add hover effect
    toggleBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    
    toggleBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    // Toggle functionality
    toggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Update button icon
        if(document.body.classList.contains('dark-mode')) {
            this.innerHTML = '🌙';
            // Add CSS variables for dark mode
            document.documentElement.style.setProperty('--color-background', '#121212');
            document.documentElement.style.setProperty('--color-text', '#ffffff');
            document.documentElement.style.setProperty('--color-text-light', '#aaaaaa');
            document.documentElement.style.setProperty('--color-border', '#333333');
        } else {
            this.innerHTML = '☀️';
            // Reset to default light mode variables
            document.documentElement.style.setProperty('--color-background', '#ffffff');
            document.documentElement.style.setProperty('--color-text', '#000000');
            document.documentElement.style.setProperty('--color-text-light', '#666666');
            document.documentElement.style.setProperty('--color-border', '#e0e0e0');
        }
    });
}

/**
 * Add lazy loading for images
 */
function lazyLoadImages() {
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    
                    imageObserver.unobserve(img);
                }
            });
        });
        
        // Target all images with data-src attribute
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }
}

// Call lazy loading after DOM is loaded
document.addEventListener('DOMContentLoaded', lazyLoadImages);
