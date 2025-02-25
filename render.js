document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const renderMenuItem = document.getElementById('render-menu');
    const renderModal = document.getElementById('render-modal');
    const closeModal = document.querySelector('.close-modal');
    const cancelRender = document.getElementById('cancel-render');
    const renderBtn = document.getElementById('render-btn');
    const downloadBtn = document.getElementById('download-btn');
    const renderPreview = document.getElementById('render-preview');
    const renderLoading = document.getElementById('render-loading');
    const renderWidth = document.getElementById('render-width');
    const renderHeight = document.getElementById('render-height');
    const renderQuality = document.getElementById('render-quality');
    const qualityValue = document.getElementById('quality-value');
    const presetButtons = document.querySelectorAll('.presets button');
    const fileFormat = document.getElementById('file-format');
    const bgOptions = document.querySelectorAll('input[name="background"]');
    const bgColor = document.getElementById('bg-color');
    
    // Default settings
    const defaultSettings = {
        width: 1920,
        height: 1080,
        quality: 0.9,
        background: 'scene',
        format: 'png'
    };
    
    // Current render result
    let renderedImage = null;
    
    // Setup event listeners
    renderMenuItem.addEventListener('click', () => {
        // Find "Render Image" option in the menu
        const options = ['Render Image', 'Render Settings', 'Render Animation'];
        showContextMenu(renderMenuItem, options);
    });
    
    // Handle render menu actions
    function handleMenuAction(action) {
        if (action === 'Render Image') {
            openRenderModal();
        }
    }
    
    // Add to existing handleMenuAction function in script.js
    // We'll simulate this here
    document.addEventListener('click', function(e) {
        if (e.target.closest('.menu-item') && e.target.textContent === 'Render Image') {
            openRenderModal();
        }
    });
    
    function openRenderModal() {
        resetRenderSettings();
        updatePreview(true); // Generate a quick preview
        renderModal.style.display = 'block';
    }
    
    function closeRenderModal() {
        renderModal.style.display = 'none';
        renderedImage = null;
        downloadBtn.disabled = true;
    }
    
    closeModal.addEventListener('click', closeRenderModal);
    cancelRender.addEventListener('click', closeRenderModal);
    
    // Close when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === renderModal) {
            closeRenderModal();
        }
    });
    
    // Settings interactions
    renderQuality.addEventListener('input', () => {
        qualityValue.textContent = renderQuality.value;
    });
    
    // Resolution presets
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            renderWidth.value = button.dataset.width;
            renderHeight.value = button.dataset.height;
            updatePreview(true);
        });
    });
    
    // Update preview when settings change
    renderWidth.addEventListener('change', () => updatePreview(true));
    renderHeight.addEventListener('change', () => updatePreview(true));
    fileFormat.addEventListener('change', () => updatePreview(true));
    bgColor.addEventListener('input', () => updatePreview(true));
    
    bgOptions.forEach(option => {
        option.addEventListener('change', () => {
            bgColor.disabled = option.value !== 'custom';
            updatePreview(true);
        });
    });
    
    // Reset render settings to defaults
    function resetRenderSettings() {
        renderWidth.value = defaultSettings.width;
        renderHeight.value = defaultSettings.height;
        renderQuality.value = defaultSettings.quality;
        qualityValue.textContent = defaultSettings.quality;
        
                // Set background option
        bgOptions.forEach(option => {
            if (option.value === defaultSettings.background) {
                option.checked = true;
            }
        });
        bgColor.disabled = defaultSettings.background !== 'custom';
        bgColor.value = '#ffffff';
        
        // Set file format
        fileFormat.value = defaultSettings.format;
        
        // Reset preview
        renderPreview.width = 0;
        renderPreview.height = 0;
        downloadBtn.disabled = true;
        renderedImage = null;
    }
    
    // Update the preview based on current settings
    function updatePreview(isPreview = true) {
        const width = isPreview ? Math.min(parseInt(renderWidth.value) / 4, 300) : parseInt(renderWidth.value);
        const height = isPreview ? Math.min(parseInt(renderHeight.value) / 4, 200) : parseInt(renderHeight.value);
        
        // Set canvas size
        renderPreview.width = width;
        renderPreview.height = height;
        
        // Get background settings
        let bgType = 'scene';
        bgOptions.forEach(option => {
            if (option.checked) {
                bgType = option.value;
            }
        });
        
        // Generate the render
        renderScene(renderPreview, width, height, bgType, bgColor.value, isPreview);
    }
    
    // Render button click handler
    renderBtn.addEventListener('click', function() {
        // Show loading overlay
        renderLoading.style.display = 'flex';
        
        // Small delay to let the UI update
        setTimeout(() => {
            // Render at full resolution
            updatePreview(false);
            
            // Save the current canvas data as the rendered image
            renderedImage = renderPreview.toDataURL('image/' + fileFormat.value, parseFloat(renderQuality.value));
            
            // Enable download button
            downloadBtn.disabled = false;
            
            // Hide loading overlay
            renderLoading.style.display = 'none';
        }, 100);
    });
    
    // Download button click handler
    downloadBtn.addEventListener('click', function() {
        if (!renderedImage) return;
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = renderedImage;
        
        // Set filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const format = fileFormat.value;
        link.download = `render_${timestamp}.${format}`;
        
        // Add to document, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // Function to render the scene to a canvas
    function renderScene(canvas, width, height, backgroundType, backgroundColor, isPreview) {
        const ctx = canvas.getContext('2d');
        
        // Handle background
        if (backgroundType === 'transparent' && fileFormat.value === 'png') {
            // Keep canvas transparent
            ctx.clearRect(0, 0, width, height);
        } else if (backgroundType === 'custom') {
            // Fill with custom color
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
        } else {
            // Use scene background - get it from the main scene
            ctx.fillStyle = '#242424'; // Same as scene background in main script
            ctx.fillRect(0, 0, width, height);
        }
        
        // Get reference to the 3D scene and renderer
        // In a real application, we would access these from the main script
        // Since we're in a separate file, we need to use a different approach
        
        // Method 1: If the main script exposes the scene and renderer globally
        if (window.getSceneForRender) {
            // Function provided by main script
            const scene = window.getSceneForRender();
            renderSceneToCanvas(scene, canvas, width, height);
        } else {
            // Method 2: If we don't have access, simulate a render
            simulateRender(ctx, width, height, isPreview);
        }
    }
    
    // This would use the actual scene in a full implementation
    function renderSceneToCanvas(scene, canvas, width, height) {
        // In a real implementation, we would:
        // 1. Create a temporary renderer at the desired size
        // 2. Render the scene to that renderer
        // 3. Copy the result to our canvas
        
        // But since we're in a separate file without direct access to Three.js,
        // we'll handle this in the main script or simulate it
    }
    
    // Simulate a render for demo purposes
    function simulateRender(ctx, width, height, isPreview) {
        // Get the viewport canvas
        const viewport = document.getElementById('viewport');
        
        // If we have access to the viewport, we can use its content
        if (viewport) {
            try {
                // Draw the viewport content to our canvas
                ctx.drawImage(viewport, 0, 0, width, height);
                
                // Add a "render quality" effect (slightly blur if preview)
                if (isPreview) {
                    ctx.filter = 'blur(0.5px)';
                    ctx.drawImage(canvas, 0, 0);
                    ctx.filter = 'none';
                }
                
                // Add some text to show it's a rendered image
                if (!isPreview) {
                    ctx.font = Math.floor(height / 30) + 'px Arial';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.textAlign = 'right';
                    ctx.fillText('Rendered with 3D Modeler', width - 20, height - 20);
                }
            } catch (err) {
                // Fallback if we can't get the viewport content
                drawFallbackImage(ctx, width, height, isPreview);
            }
        } else {
            // Fallback if we don't have access to the viewport
            drawFallbackImage(ctx, width, height, isPreview);
        }
    }
    
    // Draw a fallback image if we can't render the actual scene
    function drawFallbackImage(ctx, width, height, isPreview) {
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw a sample 3D object (cube wireframe)
        const centerX = width / 2;
        const centerY = height / 2;
        const size = Math.min(width, height) * 0.3;
        
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = isPreview ? 1 : 2;
        
        // Front face
        ctx.beginPath();
        ctx.rect(centerX - size/2, centerY - size/2, size, size);
        ctx.stroke();
        
        // Back face
        ctx.beginPath();
        ctx.rect(centerX - size/3, centerY - size/3, size, size);
        ctx.stroke();
        
        // Connecting lines
        ctx.beginPath();
        ctx.moveTo(centerX - size/2, centerY - size/2);
        ctx.lineTo(centerX - size/3, centerY - size/3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + size/2, centerY - size/2);
        ctx.lineTo(centerX + size*2/3, centerY - size/3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX - size/2, centerY + size/2);
        ctx.lineTo(centerX - size/3, centerY + size*2/3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + size/2, centerY + size/2);
        ctx.lineTo(centerX + size*2/3, centerY + size*2/3);
        ctx.stroke();
        
        // Add a message
        ctx.font = Math.floor(height / 30) + 'px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        
        if (!isPreview) {
            ctx.fillText('Render Preview (Connect to actual scene for real render)', centerX, height - 30);
        }
    }
    
    // Add a function to be called from the main script to properly render the scene
    // This would be used by the main script to send Three.js rendering data to our render.js
    window.generateRender = function(sceneData) {
        // In a full implementation, this would receive data from the main script
        // to render the actual 3D scene at high quality
        if (renderModal.style.display === 'block') {
            // Render is open, update the preview with the real scene data
            updatePreview(false);
        }
    };
    
    // Function to connect this render.js script with the main script
    window.connectRenderer = function(mainSceneRenderer, mainScene, mainCamera) {
        // In a full implementation, this would be called from script.js to connect the systems
        console.log('Render system connected to main 3D scene');
        
        // Store references to the main scene components
        window.mainRenderer = mainSceneRenderer;
        window.mainScene = mainScene;
        window.mainCamera = mainCamera;
    };
    
    // Add a bridge to the main script for real rendering
    // This is the proper way to implement rendering in a full application
    window.getSceneForRender = function() {
        // In a real implementation, we would directly access the scene from script.js
        return window.mainScene;
    };
});
