// Main application file
// Handles common functionality across all pages

// Global state
let currentUser = null;

// Check authentication state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            updateUIForLoggedInUser(user);
            loadUserData(user.uid);
        } else {
            // User is signed out
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });

    // Update cart count display
    updateCartCount();
});

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    const loginLogoutBtn = document.getElementById('login-logout-btn');
    if (loginLogoutBtn) {
        loginLogoutBtn.textContent = 'Logout';
        loginLogoutBtn.href = '#';
        loginLogoutBtn.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    }
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    const loginLogoutBtn = document.getElementById('login-logout-btn');
    if (loginLogoutBtn) {
        loginLogoutBtn.textContent = 'Login';
        loginLogoutBtn.href = 'login.html';
        loginLogoutBtn.onclick = null;
    }
}

// Update cart count in navigation
async function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) return;

    if (!currentUser) {
        cartCountElement.textContent = '0';
        return;
    }

    try {
        const cartRef = db.collection('carts').doc(currentUser.uid);
        const cartDoc = await cartRef.get();
        
        if (cartDoc.exists) {
            const cartData = cartDoc.data();
            const totalItems = cartData.items ? cartData.items.length : 0;
            cartCountElement.textContent = totalItems;
        } else {
            cartCountElement.textContent = '0';
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        cartCountElement.textContent = '0';
    }
}

// Load user specific data
function loadUserData(userId) {
    // Load user's cart
    loadUserCart(userId);
    // Load user's favourites
    loadUserFavourites(userId);
}

// Load user's cart from Firestore
async function loadUserCart(userId) {
    try {
        const cartRef = db.collection('carts').doc(userId);
        const cartDoc = await cartRef.get();
        
        if (cartDoc.exists) {
            window.userCart = cartDoc.data().items || [];
        } else {
            window.userCart = [];
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        window.userCart = [];
    }
}

// Load user's favourites from Firestore
async function loadUserFavourites(userId) {
    try {
        const favouritesRef = db.collection('favourites').doc(userId);
        const favouritesDoc = await favouritesRef.get();
        
        if (favouritesDoc.exists) {
            window.userFavourites = favouritesDoc.data().items || [];
        } else {
            window.userFavourites = [];
        }
    } catch (error) {
        console.error('Error loading favourites:', error);
        window.userFavourites = [];
    }
}

// Show loading spinner
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div>';
    }
}

// Hide loading spinner and show content
function hideLoading(containerId, content) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = content;
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}