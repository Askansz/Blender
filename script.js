document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const viewport = document.getElementById('viewport');
    const vertexCountDisplay = document.getElementById('vertex-count');
    const statusMessage = document.getElementById('status-message');
    
    // Menu items
    const fileMenu = document.getElementById('file-menu');
    const editMenu = document.getElementById('edit-menu');
    const viewMenu = document.getElementById('view-menu');
    const objectMenu = document.getElementById('object-menu');
    const renderMenu = document.getElementById('render-menu');
    
    // Tool buttons
    const selectTool = document.getElementById('select-tool');
    const moveTool = document.getElementById('move-tool');
    const rotateTool = document.getElementById('rotate-tool');
    const scaleTool = document.getElementById('scale-tool');
    
    // Add object buttons
    const addCube = document.getElementById('add-cube');
    const addSphere = document.getElementById('add-sphere');
    const addCylinder = document.getElementById('add-cylinder');
    const addPlane = document.getElementById('add-plane');
    
    // View buttons
    const frontView = document.getElementById('front-view');
    const sideView = document.getElementById('side-view');
    const topView = document.getElementById('top-view');
    const perspectiveView = document.getElementById('perspective-view');
    
    // Object property inputs
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
    
    // Render mode
    const renderMode = document.getElementById('render-mode');
    
    // Selection info
    const selectedObjectInfo = document.getElementById('selected-object');
    
    // Three.js variables
    let scene, camera, renderer, controls;
    let objects = []; // Array to store all objects in the scene
    let selectedObject = null;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let transformControls;
    let currentTool = 'select';
    let grid, axes;
    
    // Initialize the 3D scene
    function init() {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x242424);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(
            45, viewport.clientWidth / viewport.clientHeight, 0.1, 1000
        );
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ 
            canvas: viewport, 
            antialias: true 
        });
        renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        
        // Add orbit controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        
        // Add transform controls for manipulating objects
        transformControls = new THREE.TransformControls(camera, renderer.domElement);
        transformControls.addEventListener('dragging-changed', function(event) {
            controls.enabled = !event.value;
            if (!event.value && selectedObject) {
                updateObjectProperties(selectedObject);
                updateStatus('Object transformed');
            }
        });
        scene.add(transformControls);
        
        // Create grid
        grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        scene.add(grid);
        
        // Create axes
        axes = new THREE.AxesHelper(5);
        scene.add(axes);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        // Add event listeners
        setupEventListeners();
        
        // Start animation loop
        animate();
        
        // Update status
        updateStatus('3D scene initialized');
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    function onWindowResize() {
        camera.aspect = viewport.clientWidth / viewport.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Window resize
        window.addEventListener('resize', onWindowResize);
        
        // Mouse click for selection
        viewport.addEventListener('mousedown', onMouseDown);
        
        // Tool selection
        selectTool.addEventListener('click', () => setActiveTool('select'));
        moveTool.addEventListener('click', () => setActiveTool('move'));
        rotateTool.addEventListener('click', () => setActiveTool('rotate'));
        scaleTool.addEventListener('click', () => setActiveTool('scale'));
        
        // Add objects
        addCube.addEventListener('click', () => createCube());
        addSphere.addEventListener('click', () => createSphere());
        addCylinder.addEventListener('click', () => createCylinder());
        addPlane.addEventListener('click', () => createPlane());
        
        // View changes
        frontView.addEventListener('click', () => setView('front'));
        sideView.addEventListener('click', () => setView('side'));
        topView.addEventListener('click', () => setView('top'));
        perspectiveView.addEventListener('click', () => setView('perspective'));
        
        // Render mode
        renderMode.addEventListener('change', updateRenderMode);
        
        // Menu clicks
        fileMenu.addEventListener('click', () => showContextMenu(fileMenu, ['New', 'Open', 'Save', 'Export', 'Exit']));
        editMenu.addEventListener('click', () => showContextMenu(editMenu, ['Undo', 'Redo', 'Copy', 'Paste', 'Delete']));
        viewMenu.addEventListener('click', () => showContextMenu(viewMenu, ['Frame All', 'Toggle Grid', 'Toggle Axes', 'Wireframe Mode']));
        objectMenu.addEventListener('click', () => showContextMenu(objectMenu, ['Group', 'Ungroup', 'Duplicate', 'Align', 'Center']));
        renderMenu.addEventListener('click', () => showContextMenu(renderMenu, ['Render Image', 'Render Settings', 'Render Animation']));
        
        // Property inputs
        posX.addEventListener('change', updateSelectedObjectTransform);
        posY.addEventListener('change', updateSelectedObjectTransform);
        posZ.addEventListener('change', updateSelectedObjectTransform);
        rotX.addEventListener('change', updateSelectedObjectTransform);
        rotY.addEventListener('change', updateSelectedObjectTransform);
        rotZ.addEventListener('change', updateSelectedObjectTransform);
        scaleX.addEventListener('change', updateSelectedObjectTransform);
        scaleY.addEventListener('change', updateSelectedObjectTransform);
        scaleZ.addEventListener('change', updateSelectedObjectTransform);
        
        // Material properties
        objColor.addEventListener('input', updateSelectedObjectMaterial);
        metalness.addEventListener('input', updateSelectedObjectMaterial);
        roughness.addEventListener('input', updateSelectedObjectMaterial);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyDown);
    }
    
    // Show context menu for menu items
    function showContextMenu(element, items) {
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
                handleMenuAction(item);
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
    }
    
    // Handle menu actions
    function handleMenuAction(action) {
        switch(action) {
            case 'New':
                clearScene();
                updateStatus('New scene created');
                break;
            case 'Delete':
                if (selectedObject) {
                    deleteObject(selectedObject);
                    updateStatus('Object deleted');
                }
                break;
            case 'Frame All':
                frameAllObjects();
                updateStatus('Framed all objects');
                break;
            case 'Toggle Grid':
                grid.visible = !grid.visible;
                updateStatus(`Grid ${grid.visible ? 'shown' : 'hidden'}`);
                break;
            case 'Toggle Axes':
                axes.visible = !axes.visible;
                updateStatus(`Axes ${axes.visible ? 'shown' : 'hidden'}`);
                break;
            case 'Wireframe Mode':
                toggleWireframeMode();
                break;
            case 'Duplicate':
                if (selectedObject) {
                    duplicateObject(selectedObject);
                    updateStatus('Object duplicated');
                }
                break;
            case 'Render Image':
                // Handled by render.js
                updateStatus('Opening render dialog...');
                break;
            default:
                updateStatus(`Action: ${action} - Not implemented`);
        }
    }
    
    // Mouse down handler for object selection
    function onMouseDown(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = viewport.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / viewport.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / viewport.clientHeight) * 2 + 1;
        
        // Raycast to find intersected objects
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objects, false);
        
        if (intersects.length > 0) {
            // Select the first intersected object
            selectObject(intersects[0].object);
        } else {
            // Deselect if clicked on empty space
            deselectObject();
        }
    }
    
    // Set active tool
    function setActiveTool(tool) {
        // Update UI
        selectTool.classList.toggle('active', tool === 'select');
        moveTool.classList.toggle('active', tool === 'move');
        rotateTool.classList.toggle('active', tool === 'rotate');
        scaleTool.classList.toggle('active', tool === 'scale');
        
        // Update tool state
        currentTool = tool;
        
        // Apply to transform controls if an object is selected
        if (selectedObject) {
            switch(tool) {
                case 'select':
                    transformControls.detach();
                    break;
                case 'move':
                    transformControls.setMode('translate');
                    transformControls.attach(selectedObject);
                    break;
                case 'rotate':
                    transformControls.setMode('rotate');
                    transformControls.attach(selectedObject);
                    break;
                case 'scale':
                    transformControls.setMode('scale');
                    transformControls.attach(selectedObject);
                    break;
            }
        }
        
        updateStatus(`Tool: ${tool}`);
    }
    
    // Select an object
    function selectObject(object) {
        // Deselect previous object
        if (selectedObject && selectedObject !== object) {
            selectedObject.material.emissive.setHex(0x000000);
        }
        
        // Select new object
        selectedObject = object;
        selectedObject.material.emissive.setHex(0x333333);
        
        // Update UI
        updateObjectProperties(object);
        
        // Update transform controls
        if (currentTool !== 'select') {
            transformControls.attach(selectedObject);
        }
        
        updateStatus(`Selected: ${object.name || 'Object'}`);
    }
    
    // Deselect the current object
    function deselectObject() {
        if (selectedObject) {
            selectedObject.material.emissive.setHex(0x000000);
            selectedObject = null;
            
            // Update UI
            selectedObjectInfo.textContent = 'No object selected';
            
            // Clear transform controls
            transformControls.detach();
            
            updateStatus('No selection');
        }
    }

        // Update object properties panel with selected object's values
    function updateObjectProperties(object) {
        // Update selected object name
        selectedObjectInfo.textContent = object.name || 'Unnamed Object';
        
        // Update position
        posX.value = object.position.x.toFixed(2);
        posY.value = object.position.y.toFixed(2);
        posZ.value = object.position.z.toFixed(2);
        
        // Update rotation (convert from radians to degrees)
        rotX.value = THREE.MathUtils.radToDeg(object.rotation.x).toFixed(1);
        rotY.value = THREE.MathUtils.radToDeg(object.rotation.y).toFixed(1);
        rotZ.value = THREE.MathUtils.radToDeg(object.rotation.z).toFixed(1);
        
        // Update scale
        scaleX.value = object.scale.x.toFixed(2);
        scaleY.value = object.scale.y.toFixed(2);
        scaleZ.value = object.scale.z.toFixed(2);
        
        // Update material properties
        const color = object.material.color;
        objColor.value = '#' + color.getHexString();
        
        if (object.material.metalness !== undefined) {
            metalness.value = object.material.metalness;
        }
        
        if (object.material.roughness !== undefined) {
            roughness.value = object.material.roughness;
        }
        
        // Update vertex count
        if (object.geometry) {
            let vertexCount = 0;
            if (object.geometry.attributes && object.geometry.attributes.position) {
                vertexCount = object.geometry.attributes.position.count;
            }
            vertexCountDisplay.textContent = `Vertices: ${vertexCount}`;
        }
    }
    
    // Update object transform based on property panel inputs
    function updateSelectedObjectTransform() {
        if (!selectedObject) return;
        
        // Update position
        selectedObject.position.set(
            parseFloat(posX.value),
            parseFloat(posY.value),
            parseFloat(posZ.value)
        );
        
        // Update rotation (convert from degrees to radians)
        selectedObject.rotation.set(
            THREE.MathUtils.degToRad(parseFloat(rotX.value)),
            THREE.MathUtils.degToRad(parseFloat(rotY.value)),
            THREE.MathUtils.degToRad(parseFloat(rotZ.value))
        );
        
        // Update scale
        selectedObject.scale.set(
            parseFloat(scaleX.value),
            parseFloat(scaleY.value),
            parseFloat(scaleZ.value)
        );
        
        updateStatus('Properties updated');
    }
    
    // Update material properties
    function updateSelectedObjectMaterial() {
        if (!selectedObject) return;
        
        // Update color
        selectedObject.material.color.set(objColor.value);
        
        // Update metalness and roughness for PBR materials
        if (selectedObject.material.metalness !== undefined) {
            selectedObject.material.metalness = parseFloat(metalness.value);
        }
        
        if (selectedObject.material.roughness !== undefined) {
            selectedObject.material.roughness = parseFloat(roughness.value);
        }
        
        // Ensure material update
        selectedObject.material.needsUpdate = true;
        
        updateStatus('Material updated');
    }
    
    // Create a cube
    function createCube(size = 1, position = { x: 0, y: 0, z: 0 }) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: getRandomColor(),
            metalness: 0.1,
            roughness: 0.8
        });
        
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(position.x, position.y, position.z);
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.name = 'Cube_' + objects.length;
        
        scene.add(cube);
        objects.push(cube);
        
        selectObject(cube);
        updateStatus('Cube created');
        
        return cube;
    }
    
    // Create a sphere
    function createSphere(radius = 0.5, position = { x: 0, y: 0, z: 0 }) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: getRandomColor(),
            metalness: 0.1,
            roughness: 0.6
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(position.x, position.y, position.z);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.name = 'Sphere_' + objects.length;
        
        scene.add(sphere);
        objects.push(sphere);
        
        selectObject(sphere);
        updateStatus('Sphere created');
        
        return sphere;
    }
    
    // Create a cylinder
    function createCylinder(
        radius = 0.5, 
        height = 1, 
        position = { x: 0, y: 0, z: 0 }
    ) {
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        const material = new THREE.MeshStandardMaterial({
            color: getRandomColor(),
            metalness: 0.1,
            roughness: 0.7
        });
        
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set(position.x, position.y, position.z);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        cylinder.name = 'Cylinder_' + objects.length;
        
        scene.add(cylinder);
        objects.push(cylinder);
        
        selectObject(cylinder);
        updateStatus('Cylinder created');
        
        return cylinder;
    }
    
    // Create a plane
    function createPlane(size = 2, position = { x: 0, y: 0, z: 0 }) {
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshStandardMaterial({
            color: getRandomColor(),
            metalness: 0.1,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(position.x, position.y, position.z);
        plane.receiveShadow = true;
        plane.name = 'Plane_' + objects.length;
        
        scene.add(plane);
        objects.push(plane);
        
        selectObject(plane);
        updateStatus('Plane created');
        
        return plane;
    }
    
    // Delete selected object
    function deleteObject(object) {
        scene.remove(object);
        objects = objects.filter(obj => obj !== object);
        
        transformControls.detach();
        selectedObject = null;
        selectedObjectInfo.textContent = 'No object selected';
        
        updateStatus('Object deleted');
    }
    
    // Duplicate selected object
    function duplicateObject(object) {
        let newObject;
        
        // Create a new object based on the type of the selected object
        if (object.geometry instanceof THREE.BoxGeometry) {
            const size = object.geometry.parameters.width;
            newObject = createCube(size, {
                x: object.position.x + 0.5,
                y: object.position.y,
                z: object.position.z
            });
        } else if (object.geometry instanceof THREE.SphereGeometry) {
            const radius = object.geometry.parameters.radius;
            newObject = createSphere(radius, {
                x: object.position.x + 0.5,
                y: object.position.y,
                z: object.position.z
            });
        } else if (object.geometry instanceof THREE.CylinderGeometry) {
            const radius = object.geometry.parameters.radiusTop;
            const height = object.geometry.parameters.height;
            newObject = createCylinder(radius, height, {
                x: object.position.x + 0.5,
                y: object.position.y,
                z: object.position.z
            });
        } else if (object.geometry instanceof THREE.PlaneGeometry) {
            const width = object.geometry.parameters.width;
            newObject = createPlane(width, {
                x: object.position.x + 0.5,
                y: object.position.y,
                z: object.position.z
            });
        }
        
        // Copy properties
        if (newObject) {
            // Copy material properties
            newObject.material.color.copy(object.material.color);
            
            if (object.material.metalness !== undefined && newObject.material.metalness !== undefined) {
                newObject.material.metalness = object.material.metalness;
            }
            
            if (object.material.roughness !== undefined && newObject.material.roughness !== undefined) {
                newObject.material.roughness = object.material.roughness;
            }
            
            // Copy rotation and scale
            newObject.rotation.copy(object.rotation);
            newObject.scale.copy(object.scale);
            
            // Update UI
            updateObjectProperties(newObject);
        }
    }
    
    // Clear the scene
    function clearScene() {
        // Remove all objects
        for (let i = objects.length - 1; i >= 0; i--) {
            scene.remove(objects[i]);
        }
        objects = [];
        
        // Reset selection
        transformControls.detach();
        selectedObject = null;
        selectedObjectInfo.textContent = 'No object selected';
        
        updateStatus('Scene cleared');
    }
    
    // Set the camera view
    function setView(viewType) {
        // Update UI
        frontView.classList.toggle('active', viewType === 'front');
        sideView.classList.toggle('active', viewType === 'side');
        topView.classList.toggle('active', viewType === 'top');
        perspectiveView.classList.toggle('active', viewType === 'perspective');
        
        // Update camera
        controls.reset();
        
        switch(viewType) {
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
                camera.position.set(5, 5, 5);
                camera.lookAt(0, 0, 0);
                break;
        }
        
        updateStatus(`View: ${viewType}`);
    }
    
    // Update render mode
    function updateRenderMode() {
        const mode = renderMode.value;
        
        objects.forEach(obj => {
            switch(mode) {
                case 'wireframe':
                    obj.material.wireframe = true;
                    break;
                case 'solid':
                    obj.material.wireframe = false;
                    break;
            }
        });
        
        updateStatus(`Render mode: ${mode}`);
    }
    
    // Toggle wireframe mode
    function toggleWireframeMode() {
        const currentMode = renderMode.value;
        
        if (currentMode === 'solid') {
            renderMode.value = 'wireframe';
        } else {
            renderMode.value = 'solid';
        }
        
        updateRenderMode();
    }
    
    // Frame all objects
    function frameAllObjects() {
        if (objects.length === 0) return;
        
        // Create a bounding box containing all objects
        const boundingBox = new THREE.Box3();
        
        // Add all objects to the bounding box
        objects.forEach(obj => {
            boundingBox.expandByObject(obj);
        });
        
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        // Get the max side of the bounding box
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
        
        // Set camera position and target
        const direction = new THREE.Vector3(1, 1, 1).normalize();
        camera.position.copy(center).add(direction.multiplyScalar(cameraZ));
        controls.target.copy(center);
        
        // Update camera
        camera.updateProjectionMatrix();
        controls.update();
    }
    
    // Handle keyboard shortcuts
    function handleKeyDown(event) {
        // Skip if inside input field
        if (event.target.tagName === 'INPUT') return;
        
        switch(event.key) {
            case 'Delete':
                if (selectedObject) {
                    deleteObject(selectedObject);
                }
                break;
            case 'q':
                setActiveTool('select');
                break;
            case 'w':
                setActiveTool('move');
                break;
            case 'e':
                setActiveTool('rotate');
                break;
            case 'r':
                setActiveTool('scale');
                break;
            case 'f':
                if (selectedObject) {
                    controls.target.copy(selectedObject.position);
                    controls.update();
                }
                break;
            case 'a':
                frameAllObjects();
                break;
            case '1':
                createCube();
                break;
            case '2':
                createSphere();
                break;
            case '3':
                createCylinder();
                break;
            case '4':
                createPlane();
                break;
        }
    }
    
    // Get a random color
    function getRandomColor() {
        return new THREE.Color(
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5
        );
    }
    
    // Update status message
    function updateStatus(message) {
        statusMessage.textContent = message;
        console.log(message);
    }
    
    // Initialize the app
    init();
    
    // Connect the render system to our scene
    if (window.connectRenderSystem) {
        // Pass references to our Three.js scene, camera, renderer, and objects array
        window.connectRenderSystem(scene, camera, renderer, objects);
    }
    
    // Define a function to ensure objects are captured in the render
    window.updateRenderObjects = function() {
        if (window.connectRenderSystem) {

        // Define a function to ensure objects are captured in the render
    window.updateRenderObjects = function() {
        if (window.connectRenderSystem) {
            // Update the render system with current objects
            window.connectRenderSystem(scene, camera, renderer, objects);
        }
    };
    
    // Make sure to call updateRenderObjects() whenever you add or remove objects
    // For example, after adding a new object:
    function addNewObject(object) {
        scene.add(object);
        objects.push(object);
        
        // Update the render system
        if (window.updateRenderObjects) {
            window.updateRenderObjects();
        }
    }
    
    // Add functions to camera to help with framing objects
    camera.frameAll = function() {
        if (objects.length === 0) return;
        
        // Create a bounding box containing all objects
        const boundingBox = new THREE.Box3();
        
        // Add all objects to the bounding box
        objects.forEach(obj => {
            boundingBox.expandByObject(obj);
        });
        
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        // Get the max side of the bounding box
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
        
        // Set camera position and target
        const direction = new THREE.Vector3(1, 1, 1).normalize();
        camera.position.copy(center).add(direction.multiplyScalar(cameraZ));
        controls.target.copy(center);
        
        // Update camera
        camera.updateProjectionMatrix();
        controls.update();
    };
    
    // Override the default object creation functions to ensure they update the render system
    const originalCreateCube = createCube;
    createCube = function(size, position) {
        const cube = originalCreateCube(size, position);
        if (window.updateRenderObjects) window.updateRenderObjects();
        return cube;
    };
    
    const originalCreateSphere = createSphere;
    createSphere = function(radius, position) {
        const sphere = originalCreateSphere(radius, position);
        if (window.updateRenderObjects) window.updateRenderObjects();
        return sphere;
    };
    
    const originalCreateCylinder = createCylinder;
    createCylinder = function(radius, height, position) {
        const cylinder = originalCreateCylinder(radius, height, position);
        if (window.updateRenderObjects) window.updateRenderObjects();
        return cylinder;
    };
    
    const originalCreatePlane = createPlane;
    createPlane = function(size, position) {
        const plane = originalCreatePlane(size, position);
        if (window.updateRenderObjects) window.updateRenderObjects();
        return plane;
    };
    
    const originalDeleteObject = deleteObject;
    deleteObject = function(object) {
        originalDeleteObject(object);
        if (window.updateRenderObjects) window.updateRenderObjects();
    };
    
    // Initialize with some objects to show functionality
    setTimeout(() => {
        // Add a few starter objects
        createCube(1, { x: -1.5, y: 0, z: 0 });
        createSphere(0.5, { x: 0, y: 0, z: 0 });
        createCylinder(0.5, 1, { x: 1.5, y: 0, z: 0 });
        
        // Frame all objects
        frameAllObjects();
        
        // Update status
        updateStatus('Ready');
    }, 500);
});
