document.addEventListener('DOMContentLoaded', function() {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x242424);
    
    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(3, 3, 5);
    
    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('viewport'),
        antialias: true
    });
    resizeRenderer();
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);
    
    // Add orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    
    // Application state
    let objects = [];
    let selectedObject = null;
    let currentTool = 'select';
    let renderMode = 'solid';
    let transformControls = null;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    
    // Elements
    const statusMessage = document.getElementById('status-message');
    const vertexCount = document.getElementById('vertex-count');
    const selectedObjectText = document.getElementById('selected-object');
    const toolButtons = document.querySelectorAll('.tool-btn');
    const addButtons = document.querySelectorAll('.add-btn');
    const viewButtons = document.querySelectorAll('.view-btn-group button');
    const renderModeSelect = document.getElementById('render-mode');
    
    // Properties inputs
    const posX = document.getElementById('pos-x');
    const posY = document.getElementById('pos-y');
    const posZ = document.getElementById('pos-z');
    const rotX = document.getElementById('rot-x');
    const rotY = document.getElementById('rot-y');
    const rotZ = document.getElementById('rot-z');
    const scaleX = document.getElementById('scale-x');
    const scaleY = document.getElementById('scale-y');
    const scaleZ = document.getElementById('scale-z');
    const objColor = document.getElementById('obj-color');
    const metalness = document.getElementById('metalness');
    const roughness = document.getElementById('roughness');
    
    // Initialize transform controls
    initTransformControls();
    
    // Set up event listeners
    setupEventListeners();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        controls.update();
        
        if (transformControls) {
            transformControls.update();
        }
        
        renderer.render(scene, camera);
    }
    
    // Start animation
    animate();
    
    // Functions
    
    function resizeRenderer() {
        const container = document.querySelector('.viewport-container');
        const width = container.clientWidth;
        const height = container.clientHeight - document.querySelector('.viewport-controls').clientHeight;
        
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    
    function initTransformControls() {
        // We're simulating transform controls since we can't use the actual THREE.TransformControls in this code
        // In a real implementation, you would include the THREE.TransformControls.js file and use it
        transformControls = {
            attach: function(object) {
                // Simulate attaching to an object
                updateObjectProperties(object);
            },
            detach: function() {
                // Simulate detaching
            },
            update: function() {
                // Update controls if needed
                if (selectedObject) {
                    updateObjectProperties(selectedObject);
                }
            },
            setMode: function(mode) {
                // Set the transform mode (translate, rotate, scale)
                updateStatusMessage('Transform mode: ' + mode);
            }
        };
    }
    
    function setupEventListeners() {
        // Window resize
        window.addEventListener('resize', resizeRenderer);
        
        // Tool buttons
        document.getElementById('select-tool').addEventListener('click', () => setTool('select'));
        document.getElementById('move-tool').addEventListener('click', () => setTool('move'));
        document.getElementById('rotate-tool').addEventListener('click', () => setTool('rotate'));
        document.getElementById('scale-tool').addEventListener('click', () => setTool('scale'));
        
        // Add object buttons
        document.getElementById('add-cube').addEventListener('click', () => addObject('cube'));
        document.getElementById('add-sphere').addEventListener('click', () => addObject('sphere'));
        document.getElementById('add-cylinder').addEventListener('click', () => addObject('cylinder'));
        document.getElementById('add-plane').addEventListener('click', () => addObject('plane'));
        
        // View buttons
        document.getElementById('front-view').addEventListener('click', () => setView('front'));
        document.getElementById('side-view').addEventListener('click', () => setView('side'));
        document.getElementById('top-view').addEventListener('click', () => setView('top'));
        document.getElementById('perspective-view').addEventListener('click', () => setView('perspective'));
        
        // Render mode
        renderModeSelect.addEventListener('change', () => {
            renderMode = renderModeSelect.value;
            updateRenderMode();
        });
        
        // Canvas click for object selection
        const viewport = document.getElementById('viewport');
        viewport.addEventListener('click', onCanvasClick);
        
        // Improved property input handling - add 'input' event for immediate updates
        // Position
        posX.addEventListener('input', updateObjectFromProperties);
        posY.addEventListener('input', updateObjectFromProperties);
        posZ.addEventListener('input', updateObjectFromProperties);
        
        // Rotation
        rotX.addEventListener('input', updateObjectFromProperties);
        rotY.addEventListener('input', updateObjectFromProperties);
        rotZ.addEventListener('input', updateObjectFromProperties);
        
        // Scale
        scaleX.addEventListener('input', updateObjectFromProperties);
        scaleY.addEventListener('input', updateObjectFromProperties);
        scaleZ.addEventListener('input', updateObjectFromProperties);
        
        // Material properties
        objColor.addEventListener('input', updateObjectMaterial);
        metalness.addEventListener('input', updateObjectMaterial);
        roughness.addEventListener('input', updateObjectMaterial);
    }
  
      function setTool(tool) {
        currentTool = tool;
        
        // Update UI
        toolButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === tool + '-tool') {
                btn.classList.add('active');
            }
        });
        
        // Set transform control mode
        if (transformControls) {
            switch (tool) {
                case 'select':
                    transformControls.setMode('translate');
                    break;
                case 'move':
                    transformControls.setMode('translate');
                    break;
                case 'rotate':
                    transformControls.setMode('rotate');
                    break;
                case 'scale':
                    transformControls.setMode('scale');
                    break;
            }
        }
        
        updateStatusMessage('Tool: ' + tool);
    }
    
    function addObject(type) {
        let geometry;
        let mesh;
        let name;
        
        // Create geometry based on type
        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                name = 'Cube';
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 32, 32);
                name = 'Sphere';
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                name = 'Cylinder';
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(1, 1);
                name = 'Plane';
                break;
        }
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            metalness: 0.1,
            roughness: 0.7
        });
        
        // Create mesh
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = name + '_' + objects.length;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene and objects array
        scene.add(mesh);
        objects.push(mesh);
        
        // Select the new object
        selectObject(mesh);
        
        updateStatusMessage('Added ' + name);
        updateVertexCount();
    }
    
    function selectObject(object) {
        // Deselect previous object if any
        if (selectedObject) {
            selectedObject.material.emissive.set(0x000000);
        }
        
        // Select new object
        selectedObject = object;
        
        if (selectedObject) {
            // Highlight selected object
            selectedObject.material.emissive.set(0x333333);
            
            // Update transform controls
            transformControls.attach(selectedObject);
            
            // Update UI
            selectedObjectText.textContent = selectedObject.name;
            updateObjectProperties(selectedObject);
        } else {
            transformControls.detach();
            selectedObjectText.textContent = 'No object selected';
            clearObjectProperties();
        }
    }
    
    function onCanvasClick(event) {
        if (currentTool !== 'select') return;
        
        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objects);
        
        if (intersects.length > 0) {
            selectObject(intersects[0].object);
        } else {
            selectObject(null);
        }
    }
    
    function setView(view) {
        // Update UI
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === view + '-view') {
                btn.classList.add('active');
            }
        });
        
        // Set camera position based on view
        switch (view) {
            case 'front':
                camera.position.set(0, 0, 5);
                camera.lookAt(0, 0, 0);
                break;
            case 'side':
                camera.position.set(5, 0, 0);
                camera.lookAt(0, 0, 0);
                break;
            case 'top':
                camera.position.set(0, 5, 0);
                camera.lookAt(0, 0, 0);
                break;
            case 'perspective':
                camera.position.set(3, 3, 5);
                camera.lookAt(0, 0, 0);
                break;
        }
        
        // Reset controls target
        controls.target.set(0, 0, 0);
        controls.update();
        
        updateStatusMessage('View: ' + view);
    }
    
    function updateRenderMode() {
        objects.forEach(obj => {
            switch (renderMode) {
                case 'solid':
                    obj.material.wireframe = false;
                    break;
                case 'wireframe':
                    obj.material.wireframe = true;
                    break;
                case 'material':
                    obj.material.wireframe = false;
                    // Additional material settings could be applied here
                    break;
            }
        });
        
        updateStatusMessage('Render mode: ' + renderMode);
    }
    
    function updateObjectProperties(object) {
        if (!object) return;
        
        // Set input values with actual values (no rounding/formatting)
        posX.value = object.position.x;
        posY.value = object.position.y;
        posZ.value = object.position.z;
        
        rotX.value = THREE.MathUtils.radToDeg(object.rotation.x);
        rotY.value = THREE.MathUtils.radToDeg(object.rotation.y);
        rotZ.value = THREE.MathUtils.radToDeg(object.rotation.z);
        
        scaleX.value = object.scale.x;
        scaleY.value = object.scale.y;
        scaleZ.value = object.scale.z;
        
        // Update material inputs
        const hexColor = '#' + object.material.color.getHexString();
        objColor.value = hexColor;
        
        metalness.value = object.material.metalness;
        roughness.value = object.material.roughness;
    }
    
    function updateObjectFromProperties() {
        if (!selectedObject) return;
        
        // Parse input values more robustly with fallbacks for invalid inputs
        const posXVal = parseFloat(posX.value) || 0;
        const posYVal = parseFloat(posY.value) || 0;
        const posZVal = parseFloat(posZ.value) || 0;
        
        const rotXVal = parseFloat(rotX.value) || 0;
        const rotYVal = parseFloat(rotY.value) || 0;
        const rotZVal = parseFloat(rotZ.value) || 0;
        
        const scaleXVal = parseFloat(scaleX.value) || 1;
        const scaleYVal = parseFloat(scaleY.value) || 1;
        const scaleZVal = parseFloat(scaleZ.value) || 1;
        
        // Update transform
        selectedObject.position.set(posXVal, posYVal, posZVal);
        
        selectedObject.rotation.set(
            THREE.MathUtils.degToRad(rotXVal),
            THREE.MathUtils.degToRad(rotYVal),
            THREE.MathUtils.degToRad(rotZVal)
        );
        
        selectedObject.scale.set(scaleXVal, scaleYVal, scaleZVal);
    }
    
    function updateObjectMaterial() {
        if (!selectedObject) return;
        
        // Update material properties
        selectedObject.material.color.set(objColor.value);
        selectedObject.material.metalness = parseFloat(metalness.value);
        selectedObject.material.roughness = parseFloat(roughness.value);
    }
    
        function clearObjectProperties() {
        // Clear all property inputs
        posX.value = 0;
        posY.value = 0;
        posZ.value = 0;
        rotX.value = 0;
        rotY.value = 0;
        rotZ.value = 0;
        scaleX.value = 1;
        scaleY.value = 1;
        scaleZ.value = 1;
        objColor.value = '#3498db';
        metalness.value = 0.1;
        roughness.value = 0.7;
    }
    
    function updateStatusMessage(message) {
        statusMessage.textContent = message;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            statusMessage.textContent = 'Ready';
        }, 3000);
    }
    
    function updateVertexCount() {
        let count = 0;
        objects.forEach(obj => {
            if (obj.geometry) {
                // Get vertex count
                if (obj.geometry.attributes && obj.geometry.attributes.position) {
                    count += obj.geometry.attributes.position.count;
                }
            }
        });
        
        vertexCount.textContent = 'Vertices: ' + count;
    }
    
    // Additional functions for a more complete application
    
    // Menu functionalities (simplified)
    document.getElementById('file-menu').addEventListener('click', function() {
        const options = ['New', 'Open', 'Save', 'Export', 'Import'];
        showContextMenu(this, options);
    });
    
    document.getElementById('edit-menu').addEventListener('click', function() {
        const options = ['Undo', 'Redo', 'Delete', 'Duplicate', 'Select All'];
        showContextMenu(this, options);
    });
    
    document.getElementById('view-menu').addEventListener('click', function() {
        const options = ['Show Grid', 'Show Axes', 'Toggle Wireframe', 'Viewport Render Options'];
        showContextMenu(this, options);
    });
    
    document.getElementById('object-menu').addEventListener('click', function() {
        const options = ['Add', 'Delete', 'Duplicate', 'Join', 'Separate'];
        showContextMenu(this, options);
    });
    
    document.getElementById('render-menu').addEventListener('click', function() {
        const options = ['Render Image', 'Render Settings', 'Render Animation'];
        showContextMenu(this, options);
    });
    
    function showContextMenu(element, options) {
        // Remove any existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // Create context menu
        const menu = document.createElement('div');
        menu.classList.add('context-menu');
        
        // Add menu options
        options.forEach(option => {
            const item = document.createElement('div');
            item.classList.add('menu-item');
            item.textContent = option;
            item.addEventListener('click', () => {
                handleMenuAction(option);
                menu.remove();
            });
            menu.appendChild(item);
        });
        
        // Position the menu
        const rect = element.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.backgroundColor = '#333';
        menu.style.color = '#ddd';
        menu.style.border = '1px solid #555';
        menu.style.borderRadius = '3px';
        menu.style.padding = '5px 0';
        menu.style.zIndex = '1000';
        menu.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        menu.style.minWidth = '150px';
        
        // Style menu items
        const items = menu.querySelectorAll('.menu-item');
        items.forEach(item => {
            item.style.padding = '5px 15px';
            item.style.cursor = 'pointer';
            item.style.transition = 'background-color 0.2s';
            
            item.addEventListener('mouseover', () => {
                item.style.backgroundColor = '#444';
            });
            
            item.addEventListener('mouseout', () => {
                item.style.backgroundColor = 'transparent';
            });
        });
        
        // Add to document
        document.body.appendChild(menu);
        
        // Click outside to close
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== element) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }
    
    function handleMenuAction(action) {
        // Simple implementation for demo purposes
        
        switch (action) {
            case 'New':
                resetScene();
                break;
            case 'Delete':
                deleteSelectedObject();
                break;
            case 'Duplicate':
                duplicateSelectedObject();
                break;
            case 'Show Grid':
                toggleGridHelper();
                break;
            case 'Show Axes':
                toggleAxesHelper();
                break;
            case 'Toggle Wireframe':
                toggleWireframe();
                break;
            default:
                updateStatusMessage('Action: ' + action);
                break;
        }
    }
    
    function resetScene() {
        // Remove all objects
        objects.forEach(obj => {
            scene.remove(obj);
        });
        objects = [];
        
        // Reset selection
        selectedObject = null;
        transformControls.detach();
        clearObjectProperties();
        
        // Update UI
        selectedObjectText.textContent = 'No object selected';
        updateVertexCount();
        updateStatusMessage('Scene reset');
    }
    
    function deleteSelectedObject() {
        if (!selectedObject) {
            updateStatusMessage('No object selected');
            return;
        }
        
        // Remove from scene and objects array
        scene.remove(selectedObject);
        objects = objects.filter(obj => obj !== selectedObject);
        
        // Update selection
        selectedObject = null;
        transformControls.detach();
        clearObjectProperties();
        
        // Update UI
        selectedObjectText.textContent = 'No object selected';
        updateVertexCount();
        updateStatusMessage('Object deleted');
    }
    
    function duplicateSelectedObject() {
        if (!selectedObject) {
            updateStatusMessage('No object selected');
            return;
        }
        
        // Clone geometry and material
        const newGeometry = selectedObject.geometry.clone();
        const newMaterial = selectedObject.material.clone();
        
        // Create new mesh
        const newMesh = new THREE.Mesh(newGeometry, newMaterial);
        newMesh.name = selectedObject.name + '_copy';
        
        // Copy transform
        newMesh.position.copy(selectedObject.position);
        newMesh.position.x += 0.5; // Offset slightly
        newMesh.rotation.copy(selectedObject.rotation);
        newMesh.scale.copy(selectedObject.scale);
        
        // Add to scene and objects array
        scene.add(newMesh);
        objects.push(newMesh);
        
        // Select the new object
        selectObject(newMesh);
        
        updateVertexCount();
        updateStatusMessage('Object duplicated');
    }
    
    function toggleGridHelper() {
        gridHelper.visible = !gridHelper.visible;
        updateStatusMessage('Grid ' + (gridHelper.visible ? 'shown' : 'hidden'));
    }
    
    function toggleAxesHelper() {
        axesHelper.visible = !axesHelper.visible;
        updateStatusMessage('Axes ' + (axesHelper.visible ? 'shown' : 'hidden'));
    }
    
    function toggleWireframe() {
        // Toggle wireframe for all objects
        objects.forEach(obj => {
            obj.material.wireframe = !obj.material.wireframe;
        });
        
        // Update UI
        renderModeSelect.value = objects.length > 0 && objects[0].material.wireframe ? 'wireframe' : 'solid';
        
        updateStatusMessage('Wireframe ' + (objects.length > 0 && objects[0].material.wireframe ? 'on' : 'off'));
    }
    
    // Initialize with default settings
    setTool('select');
    setView('perspective');
    updateStatusMessage('3D Modeler loaded successfully');
});
