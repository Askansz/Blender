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
    
    // Scene references
    let sceneRef = null;
    let cameraRef = null;
    let rendererRef = null;
    let sceneObjects = [];
    
    // Setup event listeners
    renderMenuItem.addEventListener('click', () => {
        // Find "Render Image" option in the menu
        const options = ['Render Image', 'Render Settings', 'Render Animation'];
        showContextMenu(renderMenuItem, options);
    });
    
    // Add to existing handleMenuAction function in script.js
    document.addEventListener('click', function(e) {
        if (e.target.closest('.menu-item') && e.target.textContent === 'Render Image') {
            openRenderModal();
        }
    });
    
    function openRenderModal() {
        resetRenderSettings();
        
        // Try to get scene references directly from the window object
        tryGetSceneReferences();
        
        // Generate preview
        setTimeout(() => {
            updatePreview(true);
        }, 100);
        
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
    
    // Try to get references to the Three.js scene, camera, and renderer
    function tryGetSceneReferences() {
        // Method 1: Direct access if variables are in window scope
        if (window.scene) {
            sceneRef = window.scene;
            console.log('Found scene reference');
        }
        
        if (window.camera) {
            cameraRef = window.camera;
            console.log('Found camera reference');
        }
        
        if (window.renderer) {
            rendererRef = window.renderer;
            console.log('Found renderer reference');
        }
        
        if (window.objects) {
            sceneObjects = window.objects;
            console.log('Found objects array: ' + sceneObjects.length + ' objects');
        }
        
        // Method 2: Try to grab from globals or DOM 
        if (!sceneRef) {
            // Fallback: Look for any THREE.Scene in window object
            for (let key in window) {
                if (window[key] instanceof THREE.Scene) {
                    sceneRef = window[key];
                    console.log('Found scene in window as: ' + key);
                    break;
                }
            }
        }
        
        if (!cameraRef) {
            // Fallback: Look for any THREE.Camera in window object
            for (let key in window) {
                if (window[key] instanceof THREE.Camera) {
                    cameraRef = window[key];
                    console.log('Found camera in window as: ' + key);
                    break;
                }
            }
        }
    }
    
    // Create a temporary camera for rendering that frames all objects
    function createRenderCamera(width, height) {
        // If we have the original camera, clone it
        if (cameraRef) {
            const renderCamera = cameraRef.clone();
            renderCamera.aspect = width / height;
            renderCamera.updateProjectionMatrix();
            
            // Frame all objects
            frameAllObjects(renderCamera);
            
            return renderCamera;
        } else {
            // Create a new perspective camera
            const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            camera.position.set(5, 5, 5);
            camera.lookAt(0, 0, 0);
            
            // Frame all objects
            frameAllObjects(camera);
            
            return camera;
        }
    }
    
    // Frame all objects in view
    function frameAllObjects(camera) {
        if (!sceneRef || !sceneObjects || sceneObjects.length === 0) return;
        
        // Create a bounding box containing all objects
        const boundingBox = new THREE.Box3();
        
        // Add all objects to the bounding box
        sceneObjects.forEach(obj => {
            if (obj.geometry) {
                obj.geometry.computeBoundingBox();
                const objBox = new THREE.Box3().setFromObject(obj);
                boundingBox.union(objBox);
            }
        });
        
        // If bounding box is valid (not empty)
        if (boundingBox.min.x !== Infinity) {
            // Get the center and size of the bounding box
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            
            // Calculate distance needed to fit the entire bounding box
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5; // Add 50% margin
            
            // Update camera position
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            
            // Position camera to frame all objects
            camera.position.copy(center).add(direction.multiplyScalar(-distance));
            camera.lookAt(center);
            
            console.log('Framed all objects: ' + sceneObjects.length + ' objects in view');
        }
    }
    
    // Update the preview based on current settings
    function updatePreview(isPreview = true) {
        // Get dimensions for render
        const width = isPreview ? Math.min(parseInt(renderWidth.value) / 4, 500) : parseInt(renderWidth.value);
        const height = isPreview ? Math.min(parseInt(renderHeight.value) / 4, 300) : parseInt(renderHeight.value);
        
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
        renderSceneToCanvas(renderPreview, width, height, bgType, bgColor.value, isPreview);
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
    function renderSceneToCanvas(canvas, width, height, backgroundType, backgroundColor, isPreview) {
        const ctx = canvas.getContext('2d');
        
        // If we have access to the actual Three.js scene, render it
        if (sceneRef && (rendererRef || window.THREE)) {
            try {
                // Create a new renderer for this specific render
                const renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: backgroundType === 'transparent' && fileFormat.value === 'png'
                });
                renderer.setSize(width, height);
                
                // Handle background
                if (backgroundType === 'transparent' && fileFormat.value === 'png') {
                    renderer.setClearColor(0x000000, 0); // Transparent
                } else if (backgroundType === 'custom') {
                    // Convert hex color to THREE.js color
                    const color = new THREE.Color(backgroundColor);
                    renderer.setClearColor(color);
                } else {
                    // Use scene background
                    renderer.setClearColor(0x242424);
                }
                
                // Create a camera that frames all objects
                const renderCamera = createRenderCamera(width, height);
                
                // Render the scene
                renderer.render(sceneRef, renderCamera);
                
                // Copy the render to our canvas
                ctx.drawImage(renderer.domElement, 0, 0);
                
                // Add a watermark for full renders
                if (!isPreview) {
                    ctx.font = Math.floor(height / 30) + 'px Arial';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.textAlign = 'right';
                    ctx.fillText('Rendered with 3D Modeler', width - 20, height - 20);
                }
                
                console.log('Rendered scene with ' + (sceneObjects ? sceneObjects.length : '?') + ' objects');
                
                // Clean up
                renderer.dispose();
                return;
                
            } catch (err) {
                console.error('Error rendering scene:', err);
                // Fallback to snapshot or dummy render
            }
        }
        
        // If we couldn't render the scene properly, try to grab a snapshot from the viewport
        const viewport = document.getElementById('viewport');
        
        if (viewport) {
            try {
                // Clear the canvas
                if (backgroundType === 'transparent' && fileFormat.value === 'png') {
                    ctx.clearRect(0, 0, width, height);
                } else if (backgroundType === 'custom') {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, width, height);
                } else {
                    // Use scene background
                    ctx.fillStyle = '#242424';
                    ctx.fillRect(0, 0, width, height);
                }
                
                // Draw the viewport content to our canvas
                ctx.drawImage(viewport, 0, 0, width, height);
                
                // Add a watermark for full renders
                if (!isPreview) {
                    ctx.font = Math.floor(height / 30) + 'px Arial';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.textAlign = 'right';
                    ctx.fillText('Rendered with 3D Modeler', width - 20, height - 20);
                }
                
                console.log('Used viewport snapshot as fallback');
                return;
                
            } catch (err) {
                console.error('Error using viewport:', err);
                // Fallback to dummy render
            }
        }
        
        // Final fallback: draw a dummy scene
        drawFallbackImage(ctx, width, height, isPreview);
    }
    
        // Draw a fallback image if we can't render the actual scene
    function drawFallbackImage(ctx, width, height, isPreview) {
        // Background based on settings
        let bgType = 'scene';
        bgOptions.forEach(option => {
            if (option.checked) {
                bgType = option.value;
            }
        });
        
        if (bgType === 'transparent' && fileFormat.value === 'png') {
            ctx.clearRect(0, 0, width, height);
        } else if (bgType === 'custom') {
            ctx.fillStyle = bgColor.value;
            ctx.fillRect(0, 0, width, height);
        } else {
            // Default scene background gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#1a1a1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Draw a sample 3D scene with multiple objects
        const centerX = width / 2;
        const centerY = height / 2;
        const size = Math.min(width, height) * 0.25;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = isPreview ? 0.5 : 1;
        
        const gridSize = size * 3;
        const gridStep = gridSize / 10;
        
        // X and Z grid (horizontal plane)
        for (let i = -5; i <= 5; i++) {
            // X lines
            ctx.beginPath();
            ctx.moveTo(centerX - gridSize/2, centerY + i * gridStep);
            ctx.lineTo(centerX + gridSize/2, centerY + i * gridStep);
            ctx.stroke();
            
            // Z lines
            ctx.beginPath();
            ctx.moveTo(centerX + i * gridStep, centerY - gridSize/2);
            ctx.lineTo(centerX + i * gridStep, centerY + gridSize/2);
            ctx.stroke();
        }
        
        // Draw cube
        drawCube(ctx, centerX - size, centerY - size/2, size * 0.8, '#3498db');
        
        // Draw sphere
        drawSphere(ctx, centerX + size * 0.7, centerY - size * 0.3, size * 0.5, '#e74c3c');
        
        // Draw cylinder
        drawCylinder(ctx, centerX, centerY + size * 0.7, size * 0.4, size * 0.9, '#2ecc71');
        
        // Add a message about render status
        ctx.font = Math.floor(height / 30) + 'px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        
        if (!isPreview) {
            ctx.fillText('Sample Render (Connect to actual scene for real render)', centerX, height - 30);
        }
    }
    
    // Helper function to draw a 3D-looking cube
    function drawCube(ctx, x, y, size, color) {
        const depth = size * 0.5;
        
        // Front face
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.stroke();
        
        // Top face
        ctx.fillStyle = lightenColor(color, 30);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + depth, y - depth);
        ctx.lineTo(x + size + depth, y - depth);
        ctx.lineTo(x + size, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Right face
        ctx.fillStyle = darkenColor(color, 20);
        ctx.beginPath();
        ctx.moveTo(x + size, y);
        ctx.lineTo(x + size + depth, y - depth);
        ctx.lineTo(x + size + depth, y + size - depth);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // Helper function to draw a 3D-looking sphere
    function drawSphere(ctx, x, y, radius, color) {
        // Main circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ellipse for 3D effect
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 0.9, radius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 0.5, radius * 0.9, Math.PI/2, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Helper function to draw a 3D-looking cylinder
    function drawCylinder(ctx, x, y, radius, height, color) {
        const centerX = x;
        const topY = y - height/2;
        const bottomY = y + height/2;
        
        // Top ellipse
        ctx.fillStyle = lightenColor(color, 20);
        ctx.beginPath();
        ctx.ellipse(centerX, topY, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();
        
        // Bottom ellipse
        ctx.fillStyle = darkenColor(color, 10);
        ctx.beginPath();
        ctx.ellipse(centerX, bottomY, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Side rectangle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX - radius, topY);
        ctx.lineTo(centerX + radius, topY);
        ctx.lineTo(centerX + radius, bottomY);
        ctx.lineTo(centerX - radius, bottomY);
        ctx.closePath();
        ctx.fill();
        
        // Side edges
        ctx.beginPath();
        ctx.moveTo(centerX - radius, topY);
        ctx.lineTo(centerX - radius, bottomY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + radius, topY);
        ctx.lineTo(centerX + radius, bottomY);
        ctx.stroke();
    }
    
    // Helper function to lighten a color
    function lightenColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const r = Math.min(255, Math.floor((num >> 16) * (1 + percent/100)));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) * (1 + percent/100)));
        const b = Math.min(255, Math.floor((num & 0x0000FF) * (1 + percent/100)));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Helper function to darken a color
    function darkenColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const r = Math.floor((num >> 16) * (1 - percent/100));
        const g = Math.floor(((num >> 8) & 0x00FF) * (1 - percent/100));
        const b = Math.floor((num & 0x0000FF) * (1 - percent/100));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Function to connect our renderer to the main script
    // This should be called from script.js
    window.connectRenderSystem = function(mainScene, mainCamera, mainRenderer, objectsArray) {
        console.log('Connecting render system to main scene');
        sceneRef = mainScene;
        cameraRef = mainCamera;
        rendererRef = mainRenderer;
        sceneObjects = objectsArray || [];
        
        // Log what we found
        console.log('Connected scene has ' + sceneObjects.length + ' objects');
    };
    
    // Add context menu functionality if not already defined
    if (typeof showContextMenu !== 'function') {
        // Simple implementation of context menu for render options
        window.showContextMenu = function(element, items) {
            // Remove any existing context menus
            const existingMenus = document.querySelectorAll('.context-menu');
            existingMenus.forEach(menu => menu.remove());
            
            // Create menu element
            const menu = document.createElement('div');
            menu.classList.add('context-menu');
            
            // Add menu items
            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.classList.add('menu-item');
                menuItem.textContent = item;
                menuItem.addEventListener('click', () => {
                    if (item === 'Render Image') {
                        openRenderModal();
                    }
                    menu.remove();
                });
                menu.appendChild(menuItem);
            });
            
            // Position menu near the element
            const rect = element.getBoundingClientRect();
            menu.style.left = rect.left + 'px';
            menu.style.top = (rect.bottom + 5) + 'px';
            
            // Add to document
            document.body.appendChild(menu);
            
            // Close on click outside
            setTimeout(() => {
                window.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target) && e.target !== element) {
                        menu.remove();
                        window.removeEventListener('click', closeMenu);
                    }
                });
            }, 0);
        };
    }
});
