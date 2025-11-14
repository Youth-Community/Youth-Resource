// Youth Resources - Main JavaScript File

// Global variables
let currentUser = null;
let userRole = 'user'; // Default role
let userCoins = 0;
let viewedAds = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeAnimations();
    loadUserData();
});

// Initialize main application features
function initializeApp() {
    // Initialize typed text animation
    if (document.getElementById('typed-text')) {
        new Typed('#typed-text', {
            strings: [
                'Empower Your Future',
                'Learn Without Limits',
                'Connect and Grow',
                'Share Your Knowledge'
            ],
            typeSpeed: 80,
            backSpeed: 50,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }

    // Initialize content slider
    if (document.getElementById('content-slider')) {
        new Splide('#content-slider', {
            type: 'loop',
            perPage: 3,
            perMove: 1,
            gap: '2rem',
            autoplay: true,
            interval: 4000,
            breakpoints: {
                768: { perPage: 1 },
                1024: { perPage: 2 }
            }
        }).mount();
    }

    // Initialize floating particles
    initializeParticles();
    
    // Initialize statistics counter
    animateCounters();
    
    // Initialize mobile menu
    setupMobileMenu();
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Form submissions
    const uploadForm = document.getElementById('upload-form');
    const ideaForm = document.getElementById('idea-form');
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadSubmission);
    }
    
    if (ideaForm) {
        ideaForm.addEventListener('submit', handleIdeaSubmission);
    }

    // Scroll animations
    window.addEventListener('scroll', handleScrollAnimations);
}

// Initialize particle system
function initializeParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    // Create floating particles
    for (let i = 0; i < 50; i++) {
        createParticle(container);
    }
}

// Create individual particle
function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 6 + 2}px;
        height: ${Math.random() * 6 + 2}px;
        background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 20 + 10}s infinite linear;
    `;
    
    container.appendChild(particle);
}

// Initialize animations
function initializeAnimations() {
    // Animate feature cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.card-hover').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

// Animate statistics counters
function animateCounters() {
    const counters = document.querySelectorAll('.stats-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current).toLocaleString();
        }, 16);
    });
}

// Handle scroll animations
function handleScrollAnimations() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-particles');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
}

// Mobile menu functionality
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// Navigation functions
function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Modal functions
function openUploadModal(type = 'book') {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

function openIdeaModal() {
    const modal = document.getElementById('idea-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeIdeaModal() {
    const modal = document.getElementById('idea-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

function openArticleEditor() {
    const editor = document.getElementById('article-editor');
    if (editor) {
        editor.scrollIntoView({ behavior: 'smooth' });
        editor.focus();
    }
}

function openCourseModal() {
    showNotification('Course creation feature coming soon! Stay tuned for updates.', 'info');
}

// Text editor functions
function formatText(command) {
    document.execCommand(command, false, null);
}

function insertImage() {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl) {
        document.execCommand('insertImage', false, imageUrl);
    }
}

function insertLink() {
    const linkUrl = prompt('Enter link URL:');
    if (linkUrl) {
        document.execCommand('createLink', false, linkUrl);
    }
}

// Content submission handlers
function handleUploadSubmission(e) {
    e.preventDefault();
    
    // Simulate upload process
    showNotification('Content uploaded successfully! It will be reviewed by our team.', 'success');
    closeUploadModal();
    
    // Reset form
    e.target.reset();
}

function handleIdeaSubmission(e) {
    e.preventDefault();
    
    // Simulate idea submission
    showNotification('Your idea has been shared with the community!', 'success');
    closeIdeaModal();
    
    // Reset form
    e.target.reset();
}

function publishArticle() {
    const title = document.querySelector('input[placeholder="Article Title"]').value;
    const category = document.querySelector('input[placeholder="Category (e.g., Education, Career, Technology)"]').value;
    const content = document.getElementById('article-editor').innerHTML;
    
    if (!title || !category || !content) {
        showNotification('Please fill in all fields before publishing.', 'error');
        return;
    }
    
    // Simulate article publication
    showNotification('Article published successfully! It is now available to the community.', 'success');
    
    // Reset form
    document.querySelector('input[placeholder="Article Title"]').value = '';
    document.querySelector('input[placeholder="Category (e.g., Education, Career, Technology)"]').value = '';
    document.getElementById('article-editor').innerHTML = '';
}

function saveDraft() {
    const title = document.querySelector('input[placeholder="Article Title"]').value;
    const content = document.getElementById('article-editor').innerHTML;
    
    // Save to localStorage
    localStorage.setItem('articleDraft', JSON.stringify({
        title: title,
        content: content,
        timestamp: new Date().toISOString()
    }));
    
    showNotification('Draft saved successfully!', 'success');
}

// User data management
function loadUserData() {
    // Simulate loading user data
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        userRole = currentUser.role || 'user';
        userCoins = currentUser.coins || 0;
        updateUserInterface();
    }
}

function updateUserInterface() {
    // Update UI based on user role
    if (userRole === 'mastermind') {
        addMastermindFeatures();
    } else if (userRole === 'manager') {
        addManagerFeatures();
    }
}

function addMastermindFeatures() {
    // Add mastermind-specific UI elements
    const nav = document.querySelector('nav');
    if (nav) {
        const mastermindLink = document.createElement('a');
        mastermindLink.href = 'mastermind.html';
        mastermindLink.textContent = 'Mastermind Dashboard';
        mastermindLink.className = 'text-gray-700 hover:text-green-600 font-medium transition-colors';
        nav.querySelector('.hidden.md\\:flex').appendChild(mastermindLink);
    }
}

function addManagerFeatures() {
    // Add manager-specific UI elements
    const nav = document.querySelector('nav');
    if (nav) {
        const managerLink = document.createElement('a');
        managerLink.href = 'manager.html';
        managerLink.textContent = 'Manager Dashboard';
        managerLink.className = 'text-gray-700 hover:text-green-600 font-medium transition-colors';
        nav.querySelector('.hidden.md\\:flex').appendChild(managerLink);
    }
}

// Ads and rewards system
function watchAd() {
    // Simulate ad viewing
    showNotification('Watching ad... Please wait.', 'info');
    
    setTimeout(() => {
        userCoins += 1;
        viewedAds.push(new Date().toISOString());
        updateUserCoins();
        showNotification('Ad completed! You earned 1 coin.', 'success');
    }, 3000);
}

function updateUserCoins() {
    // Update coin display if exists
    const coinDisplay = document.getElementById('user-coins');
    if (coinDisplay) {
        coinDisplay.textContent = userCoins;
    }
    
    // Save to localStorage
    if (currentUser) {
        currentUser.coins = userCoins;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300`;
    
    // Set notification style based on type
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
    }
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <p class="mr-4">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Search functionality
function performSearch(query, filters = {}) {
    // Simulate search functionality
    const mockResults = [
        { title: 'Digital Literacy Guide', type: 'article', author: 'Sarah Chen' },
        { title: 'Leadership Skills Workshop', type: 'course', author: 'Marcus Johnson' },
        { title: 'Career Development Basics', type: 'book', author: 'Dr. Amanda Rodriguez' },
        { title: 'Study Techniques Collection', type: 'resource', author: 'Learning Community' }
    ];
    
    // Filter results based on query
    const filteredResults = mockResults.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.author.toLowerCase().includes(query.toLowerCase())
    );
    
    return filteredResults;
}

// Content management functions
function approveContent(contentId) {
    if (userRole === 'manager' || userRole === 'mastermind') {
        showNotification(`Content ${contentId} has been approved and published.`, 'success');
    } else {
        showNotification('You do not have permission to approve content.', 'error');
    }
}

function rejectContent(contentId, reason) {
    if (userRole === 'manager' || userRole === 'mastermind') {
        showNotification(`Content ${contentId} has been rejected. Reason: ${reason}`, 'warning');
    } else {
        showNotification('You do not have permission to reject content.', 'error');
    }
}

function deleteContent(contentId) {
    if (userRole === 'mastermind') {
        showNotification(`Content ${contentId} has been deleted.`, 'warning');
    } else {
        showNotification('You do not have permission to delete content.', 'error');
    }
}

// User management functions
function createManagerAccount(username, password) {
    if (userRole === 'mastermind') {
        // Simulate manager account creation
        showNotification(`Manager account '${username}' created successfully!`, 'success');
    } else {
        showNotification('Only mastermind can create manager accounts.', 'error');
    }
}

function deleteUser(userId) {
    if (userRole === 'mastermind') {
        showNotification(`User ${userId} has been deleted.`, 'warning');
    } else {
        showNotification('You do not have permission to delete users.', 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

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

// Export functions for use in other pages
window.YouthResources = {
    showNotification,
    performSearch,
    approveContent,
    rejectContent,
    deleteContent,
    createManagerAccount,
    deleteUser,
    watchAd,
    userRole,
    userCoins,
    currentUser
};

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% { transform: translateY(0px) translateX(0px); }
        25% { transform: translateY(-20px) translateX(10px); }
        50% { transform: translateY(-10px) translateX(-10px); }
        75% { transform: translateY(-30px) translateX(5px); }
        100% { transform: translateY(0px) translateX(0px); }
    }
    
    .content-card img {
        transition: transform 0.3s ease;
    }
    
    .content-card:hover img {
        transform: scale(1.05);
    }
    
    .editor-container:focus-within {
        border-color: var(--forest-green);
        box-shadow: 0 0 0 3px rgba(45, 90, 61, 0.1);
    }
`;
document.head.appendChild(style);