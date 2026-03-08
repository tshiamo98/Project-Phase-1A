// Cart handling module

// Add item to cart
async function addToCart(productId) {
    if (!currentUser) {
        showMessage('Please login to add items to cart', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const size = document.getElementById('modal-size').value;
    const quantity = parseInt(document.getElementById('modal-quantity').value);
    
    try {
        // Get product details
        const productDoc = await db.collection('products').doc(productId).get();
        if (!productDoc.exists) {
            showMessage('Product not found', 'error');
            return;
        }
        
        const product = productDoc.data();
        
        // Create cart item
        const cartItem = {
            productId: productId,
            name: product.name,
            price: product.price,
            size: size,
            quantity: quantity,
            image: product.image,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add to user's cart in Firestore
        const cartRef = db.collection('carts').doc(currentUser.uid);
        
        await db.runTransaction(async (transaction) => {
            const cartDoc = await transaction.get(cartRef);
            
            if (cartDoc.exists) {
                const cartData = cartDoc.data();
                const items = cartData.items || [];
                
                // Check if item already exists with same product and size
                const existingItemIndex = items.findIndex(
                    item => item.productId === productId && item.size === size
                );
                
                if (existingItemIndex > -1) {
                    // Update quantity of existing item
                    items[existingItemIndex].quantity += quantity;
                } else {
                    // Add new item
                    items.push(cartItem);
                }
                
                transaction.update(cartRef, { items: items });
            } else {
                // Create new cart
                transaction.set(cartRef, { items: [cartItem] });
            }
        });
        
        // Close modal
        document.getElementById('product-modal').style.display = 'none';
        
        // Update cart count
        updateCartCount();
        
        showMessage('Item added to cart successfully!', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Error adding item to cart', 'error');
    }
}

// Load cart items
async function loadCart() {
    const cartContainer = document.getElementById('cart-items-container');
    if (!cartContainer) return;
    
    if (!currentUser) {
        cartContainer.innerHTML = `
            <div class="empty-state">
                <p>Please login to view your cart</p>
                <a href="login.html" class="btn-primary">Login</a>
            </div>
        `;
        return;
    }
    
    showLoading('cart-items-container');
    
    try {
        const cartRef = db.collection('carts').doc(currentUser.uid);
        const cartDoc = await cartRef.get();
        
        if (cartDoc.exists && cartDoc.data().items && cartDoc.data().items.length > 0) {
            displayCartItems(cartDoc.data().items);
        } else {
            cartContainer.innerHTML = `
                <div class="empty-state">
                    <p>Your cart is empty</p>
                    <a href="products.html" class="btn-primary">Continue Shopping</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cartContainer.innerHTML = '<p class="error">Error loading cart. Please try again.</p>';
    }
}

// Display cart items
function displayCartItems(items) {
    const cartContainer = document.getElementById('cart-items-container');
    if (!cartContainer) return;
    
    let html = '';
    let totalItems = 0;
    
    items.forEach((item, index) => {
        totalItems += item.quantity;
        
        html += `
            <div class="cart-item" data-index="${index}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p>Price: $${item.price.toFixed(2)}</p>
                    <p>Size: ${item.size}</p>
                </div>
                <div class="cart-item-actions">
                    <input type="number" 
                           class="quantity-input" 
                           value="${item.quantity}" 
                           min="1"
                           onchange="updateCartItemQuantity(${index}, this.value)">
                    <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        `;
    });
    
    cartContainer.innerHTML = html;
    document.getElementById('total-items').textContent = totalItems;
}

// Update cart item quantity
async function updateCartItemQuantity(itemIndex, newQuantity) {
    if (!currentUser) return;
    
    try {
        const cartRef = db.collection('carts').doc(currentUser.uid);
        const cartDoc = await cartRef.get();
        
        if (cartDoc.exists) {
            const items = cartDoc.data().items;
            items[itemIndex].quantity = parseInt(newQuantity);
            
            await cartRef.update({ items: items });
            
            // Reload cart to update totals
            loadCart();
            updateCartCount();
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showMessage('Error updating quantity', 'error');
    }
}

// Remove item from cart
async function removeFromCart(itemIndex) {
    if (!currentUser) return;
    
    try {
        const cartRef = db.collection('carts').doc(currentUser.uid);
        const cartDoc = await cartRef.get();
        
        if (cartDoc.exists) {
            const items = cartDoc.data().items;
            items.splice(itemIndex, 1);
            
            await cartRef.update({ items: items });
            
            // Reload cart
            loadCart();
            updateCartCount();
            
            showMessage('Item removed from cart', 'success');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showMessage('Error removing item', 'error');
    }
}

// Place order
async function placeOrder() {
    if (!currentUser) {
        showMessage('Please login to place order', 'error');
        return;
    }
    
    try {
        const cartRef = db.collection('carts').doc(currentUser.uid);
        const cartDoc = await cartRef.get();
        
        if (!cartDoc.exists || !cartDoc.data().items || cartDoc.data().items.length === 0) {
            showMessage('Your cart is empty', 'error');
            return;
        }
        
        const items = cartDoc.data().items;
        
        // Create order summary
        let orderSummary = `Order from ${currentUser.email}\n\n`;
        orderSummary += 'Items:\n';
        
        items.forEach(item => {
            orderSummary += `- ${item.name} (Size: ${item.size}, Quantity: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        orderSummary += `\nTotal: $${total.toFixed(2)}`;
        
        // Encode the order summary for URL
        const encodedOrder = encodeURIComponent(orderSummary);
        
        // Create email link (replace with your email)
        const email = 'yourstore@email.com'; // TO EDIT: Replace with your email
        const subject = encodeURIComponent('New Order');
        const body = encodedOrder;
        
        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Clear cart after placing order
        await cartRef.update({ items: [] });
        
        // Reload cart
        loadCart();
        updateCartCount();
        
        showMessage('Order placed! Check your email client to send the order.', 'success');
    } catch (error) {
        console.error('Error placing order:', error);
        showMessage('Error placing order', 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Place order button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
    }
    
    // Load cart on cart page
    if (window.location.pathname.includes('cart.html')) {
        loadCart();
    }
});