// Products handling module

// Sample product data (will be stored in Firestore)
const sampleProducts = [
    {
        id: '1',
        name: 'Premium Vibrator',
        price: 49.99,
        category: 'vibrators',
        description: 'High-quality silicone vibrator with multiple speeds',
        image: 'https://via.placeholder.com/300x200',
        sizes: ['Small', 'Medium', 'Large']
    },
    {
        id: '2',
        name: 'Classic Dildo',
        price: 39.99,
        category: 'dildos',
        description: 'Realistic dildo made from body-safe silicone',
        image: 'https://via.placeholder.com/300x200',
        sizes: ['Small', 'Medium', 'Large', 'Extra Large']
    },
    {
        id: '3',
        name: 'Couples Vibrator',
        price: 79.99,
        category: 'couples',
        description: 'Remote-controlled vibrator for couples',
        image: 'https://via.placeholder.com/300x200',
        sizes: ['One Size']
    },
    {
        id: '4',
        name: 'Bondage Kit',
        price: 59.99,
        category: 'bdsm',
        description: 'Starter bondage kit with cuffs and blindfold',
        image: 'https://via.placeholder.com/300x200',
        sizes: ['One Size']
    }
];

// Initialize products in Firestore (run once)
async function initializeProducts() {
    try {
        const batch = db.batch();
        
        for (const product of sampleProducts) {
            const productRef = db.collection('products').doc(product.id);
            batch.set(productRef, product);
        }
        
        await batch.commit();
        console.log('Products initialized successfully');
    } catch (error) {
        console.error('Error initializing products:', error);
    }
}

// Load products from Firestore
async function loadProducts(category = 'all') {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    showLoading('products-container');
    
    try {
        let query = db.collection('products');
        
        if (category !== 'all') {
            query = query.where('category', '==', category);
        }
        
        const querySnapshot = await query.get();
        const products = [];
        
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = '<p class="error">Error loading products. Please try again.</p>';
    }
}

// Display products in grid
function displayProducts(products) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="empty-state">No products found.</p>';
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        html += `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <p class="product-description">${product.description}</p>
                    <div class="product-actions">
                        <button class="add-to-cart" onclick="openProductModal('${product.id}')">
                            Add to Cart
                        </button>
                        <button class="add-to-favourites" onclick="toggleFavourite('${product.id}')">
                            ♥
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsContainer.innerHTML = html;
}

// Open product modal for size and quantity selection
function openProductModal(productId) {
    const modal = document.getElementById('product-modal');
    const modalContent = document.getElementById('modal-product-details');
    
    // Get product details from Firestore
    db.collection('products').doc(productId).get()
        .then((doc) => {
            if (doc.exists) {
                const product = doc.data();
                
                let sizeOptions = '';
                product.sizes.forEach(size => {
                    sizeOptions += `<option value="${size}">${size}</option>`;
                });
                
                modalContent.innerHTML = `
                    <h2>${product.name}</h2>
                    <img src="${product.image}" alt="${product.name}" style="width: 100%; max-height: 300px; object-fit: cover;">
                    <p>${product.description}</p>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    
                    <div class="form-group">
                        <label for="modal-size">Size:</label>
                        <select id="modal-size" class="size-select">
                            ${sizeOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="modal-quantity">Quantity:</label>
                        <input type="number" id="modal-quantity" min="1" value="1" class="quantity-input">
                    </div>
                    
                    <button onclick="addToCart('${productId}')" class="btn-primary">
                        Add to Cart
                    </button>
                `;
                
                modal.style.display = 'block';
            }
        })
        .catch((error) => {
            console.error('Error loading product:', error);
        });
}

// Close modal when clicking on X or outside
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            loadProducts(e.target.value);
        });
    }
    
    // Load products on page load
    loadProducts();
});

// Initialize products if needed (uncomment to run once)
// initializeProducts();