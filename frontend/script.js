// Global variables
let currentProducts = [];

// DOM elements
const imageUpload = document.getElementById('imageUpload');
const uploadBtn = document.getElementById('uploadBtn');
const imageUrl = document.getElementById('imageUrl');
const urlBtn = document.getElementById('urlBtn');
const resultsSection = document.getElementById('resultsSection');
const uploadedImage = document.getElementById('uploadedImage');
const productsGrid = document.getElementById('productsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const similarityFilter = document.getElementById('similarityFilter');
const debugSection = document.getElementById('debugSection');
const debugInfo = document.getElementById('debugInfo');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Visual Product Matcher initialized');
    
    // Add event listeners
    if (uploadBtn) uploadBtn.addEventListener('click', handleImageUpload);
    if (urlBtn) urlBtn.addEventListener('click', handleUrlUpload);
    if (similarityFilter) similarityFilter.addEventListener('change', filterProductsBySimilarity);
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Show debug section in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        debugSection.classList.remove('d-none');
    }
    
    // Test backend connection
    testBackendConnection();
});

// Setup drag and drop functionality
function setupDragAndDrop() {
    const dropArea = document.querySelector('.upload-area');
    if (!dropArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
    dropArea.addEventListener('click', () => imageUpload.click());
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    const dropArea = document.querySelector('.upload-area');
    dropArea.style.borderColor = '#0d6efd';
    dropArea.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
}

function unhighlight() {
    const dropArea = document.querySelector('.upload-area');
    dropArea.style.borderColor = '#dee2e6';
    dropArea.style.backgroundColor = '';
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
        imageUpload.files = files;
        updateDropArea(files[0].name);
    }
}

function updateDropArea(fileName) {
    const dropArea = document.querySelector('.upload-area');
    if (dropArea) {
        dropArea.innerHTML = `
            <i class="fas fa-check-circle text-success"></i>
            <h5>${fileName}</h5>
            <p class="text-muted">Click to change</p>
        `;
    }
}

// Handle image upload
function handleImageUpload() {
    const file = imageUpload.files[0];
    if (!file) {
        showError('Please select an image to upload');
        return;
    }
    
    processImage(file);
}

// Handle URL upload
function handleUrlUpload() {
    const url = imageUrl.value.trim();
    if (!url) {
        showError('Please enter an image URL');
        return;
    }
    
    try {
        new URL(url);
        processImageUrl(url);
    } catch (e) {
        showError('Please enter a valid URL');
    }
}

// Process image from file
async function processImage(file) {
    hideError();
    showLoading();
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
        } else {
            showError('Failed to process image');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Process image from URL
async function processImageUrl(url) {
    hideError();
    showLoading();
    
    try {
        const response = await fetch('/api/url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
        } else {
            showError('Failed to process image URL');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Display results
function displayResults(data) {
    currentProducts = data.products || [];
    uploadedImage.src = 'data:image/jpeg;base64,' + data.uploaded_image;
    resultsSection.classList.remove('d-none');
    
    filterProductsBySimilarity();
}

// Filter products by similarity threshold
function filterProductsBySimilarity() {
    const threshold = parseFloat(similarityFilter.value);
    const filteredProducts = currentProducts.filter(
        product => product.similarity >= threshold
    );
    
    renderProducts(filteredProducts);
}

// Render products to the grid
function renderProducts(products) {
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        noResults.classList.remove('d-none');
        return;
    }
    
    noResults.classList.add('d-none');
    
    products.forEach(product => {
        const similarityPercent = Math.round(product.similarity * 100);
        
        const productCard = document.createElement('div');
        productCard.className = 'col';
        productCard.innerHTML = `
            <div class="card product-card h-100">
                <div class="position-relative">
                    <img src="${product.image_url}" class="card-img-top product-image" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=Image+Not+Found'">
                    <span class="badge bg-success similarity-badge">${similarityPercent}% match</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text text-muted">${product.category}</p>
                    ${product.actual_price ? `<p class="card-text"><strong>Price: $${product.actual_price}</strong></p>` : ''}
                    ${product.ratings ? `<p class="card-text"><small class="text-muted">Rating: ${product.ratings} (${product.no_of_ratings || 0} reviews)</small></p>` : ''}
                </div>
                <div class="card-footer bg-white">
                    <a href="${product.link || '#'}" target="_blank" class="btn btn-outline-primary btn-sm w-100">View Product</a>
                </div>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    });
}

// Test backend connection
async function testBackendConnection() {
    try {
        debugInfo.innerHTML = 'Testing backend connection...';
        const response = await fetch('/api/health');
        const data = await response.json();
        debugInfo.innerHTML = `✅ Backend is running: ${data.status}<br>Message: ${data.message}`;
    } catch (error) {
        debugInfo.innerHTML = `❌ Backend connection failed: ${error.message}<br>Make sure the server is running on port 7860`;
    }
}

// Show loading state
function showLoading() {
    loadingSpinner.classList.remove('d-none');
    if (uploadBtn) uploadBtn.disabled = true;
    if (urlBtn) urlBtn.disabled = true;
}

// Hide loading state
function hideLoading() {
    loadingSpinner.classList.add('d-none');
    if (uploadBtn) uploadBtn.disabled = false;
    if (urlBtn) urlBtn.disabled = false;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
}

// Hide error message
function hideError() {
    errorAlert.classList.add('d-none');
}