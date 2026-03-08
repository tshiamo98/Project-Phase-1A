// Authentication handling module

// Login function
async function login(email, password) {
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        showMessage('Login successful!', 'success');
        
        // Redirect to products page after 1 second
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 1000);
        
        return userCredential.user;
    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.message, 'error');
        return null;
    }
}

// Register function
async function register(email, password) {
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            cart: [],
            favourites: []
        });
        
        showMessage('Registration successful!', 'success');
        
        // Redirect to products page after 1 second
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 1000);
        
        return userCredential.user;
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(error.message, 'error');
        return null;
    }
}

// Logout function
async function logout() {
    try {
        await firebase.auth().signOut();
        showMessage('Logged out successfully!', 'success');
        
        // Clear local storage
        localStorage.removeItem('userCart');
        localStorage.removeItem('userFavourites');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showMessage(error.message, 'error');
    }
}

// Event listeners for login and register forms
document.addEventListener('DOMContentLoaded', () => {
    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            await login(email, password);
        });
    }
    
    // Register form handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            
            if (password.length < 6) {
                showMessage('Password must be at least 6 characters', 'error');
                return;
            }
            
            await register(email, password);
        });
    }
});

// Function to show messages in auth forms
function showMessage(message, type) {
    const messageDiv = document.getElementById('auth-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `auth-message ${type}`;
    }
}