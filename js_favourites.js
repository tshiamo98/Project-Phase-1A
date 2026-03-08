// Favourites handling module

// Toggle favourite status
async function toggleFavourite(productId) {
    if (!currentUser) {
        showMessage('Please login to add items to favourites', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const favouritesRef = db.collection('favourites').doc(currentUser.uid);
        
        await db.runTransaction(async (transaction) => {
            const favouritesDoc = await transaction.get(favouritesRef);
            
            if (favouritesDoc.exists) {
                const favourites = favouritesDoc.data().items || [];
                const existingIndex = favourites.findIndex(item => item.productId === productId);
                
                if (existingIndex > -1) {
                    // Remove from favourites
                    favourites.splice(existingIndex, 1);
                    showMessage('Removed from favourites', 'success');
                } else {
                    // Add to favourites
                    const productDoc = await db.collection('products').doc(productId).get();
                    const product = productDoc.data();
                    
                    favourites.push({
                        productId: productId,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        addedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    showMessage('Added to favourites', 'success');
                }
                
                transaction.update(favouritesRef, { items: favourites });
            } else {
                // Create new favourites list
                const productDoc = await db.collection('products').doc(productId).get();
                const product = productDoc.data();
                
                transaction.set(favouritesRef, {
                    items: [{
                        productId: productId,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        addedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }]
                });
                
                showMessage('Added to favourites', 'success');
            }
        });
        
        // Reload favourites if on favourites page
        if (window.location.pathname.includes('favourites.html')) {
            loadFavourites();
        }
    } catch (error) {
        console.error('Error toggling favourite:', error);
        showMessage('Error updating favourites', 'error');
    }
}

// Load favourites
async function loadFavourites() {
    const favouritesContainer = document.getElementById('favourites-container');
    if (!favouritesContainer) return;
    
    if (!currentUser) {
        favouritesContainer.innerHTML = `
            <div class="empty-state">
                <p>Please login to view your favourites</p>
                <a href="login.html" class="btn-primary">Login</a>
            </div>
        `;
        return;
    }
    
    showLoading('favourites-container');
    
    try {
        const favouritesRef = db.collection('favourites').doc(currentUser.uid);
        const favouritesDoc = await favouritesRef.get();
        
        if (favouritesDoc.exists && favouritesDoc.data().items && favouritesDoc.data().items.length > 0) {
            displayFavourites(favouritesDoc.data().items);
        } else {
            favouritesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No favourites yet</p>
                    <a href="products.html" class="btn-primary">Browse Products</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading favourites:', error);
        favouritesContainer.innerHTML = '<p class="error">Error loading favourites. Please try again.</p>';
    }
}

// Display favourites
function displayFavourites(items) {
    const favouritesContainer = document.getElementById('favourites-container');
    if (!favouritesContainer) return;
    
    let html = '';
    
    items.forEach((item, index) => {
        html += `
            <div class="favourite-item" data-index="${index}">
                <img src="${item.image}" alt="${item.name}" class="favourite-item-image">
                <div class="favourite-item-details">
                    <h3>${item.name}</h3>
                    <p class="product-price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="favourite-item-actions">
                    <button class="move-to-cart" onclick="moveToCart('${item.productId}')">
                        Add to Cart
                    </button>
                    <button class="remove-favourite" onclick="removeFromFavourites(${index})">
                        Remove
                    </button>
                </div>
            </div>
        `;
    });
    
    favouritesContainer.innerHTML = html;
}

// Move item from favourites to cart
async function moveToCart(productId) {
    // First remove from favourites
    await removeFromFavouritesByProductId(productId);
    
    // Then open product modal to add to cart
    openProductModal(productId);
}

// Remove from favourites by index
async function removeFromFavourites(itemIndex) {
    if (!currentUser) return;
    
    try {
        const favouritesRef = db.collection('favourites').doc(currentUser.uid);
        const favouritesDoc = await favouritesRef.get();
        
        if (favouritesDoc.exists) {
            const items = favouritesDoc.data().items;
            items.splice(itemIndex, 1);
            
            await favouritesRef.update({ items: items });
            
            // Reload favourites
            loadFavourites();
            
            showMessage('Removed from favourites', 'success');
        }
    } catch (error) {
        console.error('Error removing from favourites:', error);
        showMessage('Error removing item', 'error');
    }
}

// Remove from favourites by product ID
async function removeFromFavouritesByProductId(productId) {
    if (!currentUser) return;
    
    try {
        const favouritesRef = db.collection('favourites').doc(currentUser.uid);
        const favouritesDoc = await favouritesRef.get();
        
        if (favouritesDoc.exists) {
            const items = favouritesDoc.data().items;
            const newItems = items.filter(item => item.productId !== productId);
            
            await favouritesRef.update({ items: newItems });
        }
    } catch (error) {
        console.error('Error removing from favourites:', error);
    }
}

// Load favourites on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('favourites.html')) {
        loadFavourites();
    }
});