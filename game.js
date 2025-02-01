class Bubble {
    constructor(scene, letter) {
        // Adjust circle size to 80% of original (0.8 instead of 0.5)
        this.geometry = new THREE.CircleGeometry(0.8, 64);
        this.material = new THREE.MeshBasicMaterial({
            color: 0x88ffff,
            transparent: true,
            opacity: 0.4
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        // Random position in 2D space
        this.mesh.position.x = Math.random() * 16 - 8;
        this.mesh.position.y = Math.random() * 12 - 6;
        this.mesh.position.z = 0;
        
        // Create letter with corrected aspect ratio
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const aspectRatio = window.innerWidth / window.innerHeight;
        
        // Make canvas square to prevent stretching
        canvas.width = 256;
        canvas.height = 256;
        
        // Clear background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw letter
        context.fillStyle = 'white';
        context.font = 'bold 120px Arial'; // Slightly smaller font
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(letter, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 1
        });
        this.letterSprite = new THREE.Sprite(spriteMaterial);
        
        // Adjust letter sprite scale to 80% of original (0.96 instead of 0.6)
        const scale = 0.96; // 80% of 1.2
        this.letterSprite.scale.set(scale, scale, 1);
        
        this.mesh.add(this.letterSprite);
        scene.add(this.mesh);
        
        // Add base speed property with slightly lower value
        this.baseSpeed = 0.025; // Reduced from 0.03
        // Initialize velocity with base speed
        this.velocity = {
            x: (Math.random() - 0.5) * this.baseSpeed,
            y: (Math.random() - 0.5) * this.baseSpeed
        };
        
        // Add small bubble decorations
        this.addBubbleDecorations(scene);
        
        this.letter = letter;
        
        // Dynamic radius calculation based on geometry and scale
        this.updateRadius(1.2); // Initial scale
    }
    
    addBubbleDecorations(scene) {
        const numDecorations = 3;
        this.decorations = [];
        
        for (let i = 0; i < numDecorations; i++) {
            const decoration = new THREE.Mesh(
                new THREE.CircleGeometry(0.08, 16), // 80% of 0.1
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.5
                })
            );
            
            const angle = (Math.PI * 2 * i) / numDecorations;
            decoration.position.x = Math.cos(angle) * 0.56; // 80% of 0.7
            decoration.position.y = Math.sin(angle) * 0.56; // 80% of 0.7
            
            this.mesh.add(decoration);
            this.decorations.push(decoration);
        }
    }
    
    normalizeVelocity() {
        // Calculate current speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        // Always normalize to base speed, not just when exceeding
        this.velocity.x = (this.velocity.x / speed) * this.baseSpeed;
        this.velocity.y = (this.velocity.y / speed) * this.baseSpeed;
    }
    
    updateRadius(scale) {
        // Calculate actual radius based on geometry and current scale
        this.radius = (this.geometry.parameters.radius * scale);
        // Add a small buffer for better collision detection
        this.collisionRadius = this.radius * 0.9; // Slightly smaller than visual radius
    }
    
    update(otherBubbles, bounds) {
        // Store previous position for collision resolution
        const prevX = this.mesh.position.x;
        const prevY = this.mesh.position.y;
        
        // Update position
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.y += this.velocity.y;
        
        // Dynamic boundary check using provided bounds
        const maxX = bounds.right - this.collisionRadius;
        const minX = bounds.left + this.collisionRadius;
        const maxY = bounds.top - this.collisionRadius;
        const minY = bounds.bottom + this.collisionRadius;
        
        // Bounce off walls with dynamic boundaries
        if (this.mesh.position.x > maxX) {
            this.velocity.x *= -1;
            this.mesh.position.x = maxX;
        } else if (this.mesh.position.x < minX) {
            this.velocity.x *= -1;
            this.mesh.position.x = minX;
        }
        
        if (this.mesh.position.y > maxY) {
            this.velocity.y *= -1;
            this.mesh.position.y = maxY;
        } else if (this.mesh.position.y < minY) {
            this.velocity.y *= -1;
            this.mesh.position.y = minY;
        }
        
        // Check collisions with other bubbles
        otherBubbles.forEach(otherBubble => {
            if (otherBubble !== this) {
                const dx = this.mesh.position.x - otherBubble.mesh.position.x;
                const dy = this.mesh.position.y - otherBubble.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = this.collisionRadius + otherBubble.collisionRadius;
                
                if (distance < minDistance) {
                    // Move bubbles apart proportionally to their overlap
                    const overlap = minDistance - distance;
                    const angle = Math.atan2(dy, dx);
                    const moveX = Math.cos(angle) * overlap * 0.5;
                    const moveY = Math.sin(angle) * overlap * 0.5;
                    
                    this.mesh.position.x += moveX;
                    this.mesh.position.y += moveY;
                    otherBubble.mesh.position.x -= moveX;
                    otherBubble.mesh.position.y -= moveY;
                    
                    // Exchange velocities
                    const tempVx = this.velocity.x;
                    const tempVy = this.velocity.y;
                    this.velocity.x = otherBubble.velocity.x;
                    this.velocity.y = otherBubble.velocity.y;
                    otherBubble.velocity.x = tempVx;
                    otherBubble.velocity.y = tempVy;
                    
                    // Normalize velocities
                    this.normalizeVelocity();
                    otherBubble.normalizeVelocity();
                }
            }
        });
        
        this.normalizeVelocity();
    }
}

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        
        // Calculate camera frustum based on aspect ratio
        const aspectRatio = window.innerWidth / window.innerHeight;
        const frustumSize = 15;
        
        this.camera = new THREE.OrthographicCamera(
            -frustumSize * aspectRatio / 2,
            frustumSize * aspectRatio / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1e3d59); // Dark blue background
        document.body.appendChild(this.renderer.domElement);
        
        // Add underwater decorations
        this.addUnderwaterElements();
        
        this.camera.position.z = 5;
        
        // Track available letters
        this.availableLetters = 'ABCDEF'.split('');
        
        // Initialize bubbles with adjusted spawn area
        this.bubbles = [];
        for (let i = 0; i < this.availableLetters.length; i++) {
            const bubble = new Bubble(this.scene, this.availableLetters[i]);
            // Adjust initial positions to be within new boundaries
            bubble.mesh.position.x = Math.random() * 14 - 7; // Reduced from 16/8
            bubble.mesh.position.y = Math.random() * 10 - 5; // Reduced from 12/6
            this.bubbles.push(bubble);
        }
        
        // Add touch support and responsive sizing
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.setupResponsiveSize();
        
        // Adjust initial bubble sizes based on screen
        this.bubbles.forEach(bubble => this.adjustBubbleSize(bubble));
        
        // Add restart button (hidden initially)
        this.createRestartButton();
        
        // Initialize audio
        this.popSound = document.getElementById('popSound');
        this.gameEndSound = document.getElementById('gameEndSound');
        this.errorSound = document.getElementById('errorSound');
        
        // Track the next expected letter
        this.nextExpectedLetter = 'A';
        
        this.score = 0;
        this.setupEventListeners();
        
        // Define game boundaries
        this.bounds = {
            left: -8,
            right: 8,
            top: 6,
            bottom: -6
        };
        
        // Add boundary visualization with padding
        this.addBoundaryBox();
        
        this.animate();
    }
    
    addUnderwaterElements() {
        // Add seaweed
        for (let i = 0; i < 5; i++) {
            const seaweed = new THREE.Mesh(
                new THREE.PlaneGeometry(0.5, 2),
                new THREE.MeshBasicMaterial({
                    color: 0x2a5c3f,
                    transparent: true,
                    opacity: 0.7
                })
            );
            seaweed.position.set(-8 + i * 4, -6, -1);
            this.scene.add(seaweed);
        }
        
        // Add fish silhouettes
        const fishGeometry = new THREE.PlaneGeometry(1, 0.5);
        const fishMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a2a3a,
            transparent: true,
            opacity: 0.3
        });
        
        for (let i = 0; i < 3; i++) {
            const fish = new THREE.Mesh(fishGeometry, fishMaterial);
            fish.position.set(Math.random() * 16 - 8, Math.random() * 8 - 2, -0.5);
            this.scene.add(fish);
        }
    }
    
    setupResponsiveSize() {
        // Adjust frustum size based on device
        this.frustumSize = this.isMobile ? 20 : 15;
        const aspectRatio = window.innerWidth / window.innerHeight;
        
        this.camera.left = -this.frustumSize * aspectRatio / 2;
        this.camera.right = this.frustumSize * aspectRatio / 2;
        this.camera.top = this.frustumSize / 2;
        this.camera.bottom = -this.frustumSize / 2;
        this.camera.updateProjectionMatrix();
    }
    
    adjustBubbleSize(bubble) {
        const baseScale = this.isMobile ? 1.44 : 0.96;
        bubble.letterSprite.scale.set(baseScale, baseScale, 1);
        
        const bubbleScale = 1.2;
        bubble.mesh.scale.set(bubbleScale, bubbleScale, 1);
        
        // Update bubble's collision radius
        bubble.updateRadius(bubbleScale);
        
        // Adjust decoration sizes
        bubble.decorations.forEach(decoration => {
            decoration.scale.set(bubbleScale, bubbleScale, 1);
        });
    }
    
    setupEventListeners() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Handle both click and touch
        const handleInteraction = (event) => {
            event.preventDefault();
            
            // Get correct coordinates whether touch or click
            const x = event.touches ? event.touches[0].clientX : event.clientX;
            const y = event.touches ? event.touches[0].clientY : event.clientY;
            
            mouse.x = (x / window.innerWidth) * 2 - 1;
            mouse.y = -(y / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            
            const intersects = raycaster.intersectObjects(this.bubbles.map(b => b.mesh));
            
            if (intersects.length > 0) {
                const clickedBubble = this.bubbles.find(b => b.mesh === intersects[0].object);
                this.popBubble(clickedBubble);
            }
        };
        
        // Add both mouse and touch event listeners
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction, { passive: false });
        
        // Handle resize
        window.addEventListener('resize', () => {
            // Update renderer size
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Update camera for new aspect ratio
            this.setupResponsiveSize();
            
            // Update all bubbles for new size
            this.bubbles.forEach(bubble => this.adjustBubbleSize(bubble));
        });
    }
    
    createRestartButton() {
        const button = document.createElement('button');
        button.textContent = 'Play Again';
        button.style.position = 'fixed';
        button.style.top = '50%';
        button.style.left = '50%';
        button.style.transform = 'translate(-50%, -50%)';
        button.style.padding = this.isMobile ? '20px 40px' : '15px 30px';
        button.style.fontSize = this.isMobile ? '32px' : '24px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.display = 'none';
        button.style.zIndex = '1000';
        
        button.addEventListener('click', () => this.restartGame());
        button.addEventListener('touchstart', () => this.restartGame(), { passive: false });
        
        document.body.appendChild(button);
        this.restartButton = button;
    }
    
    restartGame() {
        // Reset available letters
        this.availableLetters = 'ABCDEF'.split('');
        
        // Reset next expected letter
        this.nextExpectedLetter = 'A';
        
        // Clear existing bubbles
        this.bubbles.forEach(bubble => this.scene.remove(bubble.mesh));
        this.bubbles = [];
        
        // Create new bubbles
        for (let i = 0; i < this.availableLetters.length; i++) {
            const bubble = new Bubble(this.scene, this.availableLetters[i]);
            // Adjust initial positions to be within new boundaries
            bubble.mesh.position.x = Math.random() * 14 - 7; // Reduced from 16/8
            bubble.mesh.position.y = Math.random() * 10 - 5; // Reduced from 12/6
            this.bubbles.push(bubble);
        }
        
        // Reset score
        this.score = 0;
        document.getElementById('scoreValue').textContent = this.score;
        
        // Hide restart button
        this.restartButton.style.display = 'none';
    }
    
    popBubble(bubble) {
        // Check if this is the correct letter in sequence
        if (bubble.letter !== this.nextExpectedLetter) {
            // Play error sound
            this.errorSound.currentTime = 0;
            this.errorSound.play();
            return; // Don't pop the bubble
        }
        
        // Play pop sound
        this.popSound.currentTime = 0;
        this.popSound.play();
        
        // Remove bubble from scene
        this.scene.remove(bubble.mesh);
        this.bubbles = this.bubbles.filter(b => b !== bubble);
        
        // Remove the letter from available letters
        this.availableLetters = this.availableLetters.filter(l => l !== bubble.letter);
        
        // Update score
        this.score += 10;
        document.getElementById('scoreValue').textContent = this.score;
        
        // Update next expected letter
        const letters = 'ABCDEF';
        const currentIndex = letters.indexOf(this.nextExpectedLetter);
        if (currentIndex < letters.length - 1) {
            this.nextExpectedLetter = letters[currentIndex + 1];
        }
        
        // Check if game is complete
        if (this.availableLetters.length === 0) {
            // Play game completion sound
            this.gameEndSound.currentTime = 0;
            this.gameEndSound.play();
            
            // Show restart button
            this.restartButton.style.display = 'block';
        }
    }
    
    addBoundaryBox() {
        // Add padding to visual boundary
        const padding = 1;
        const visualBounds = {
            left: this.bounds.left - padding,
            right: this.bounds.right + padding,
            top: this.bounds.top + padding,
            bottom: this.bounds.bottom - padding
        };
        
        // Create boundary lines
        const vertices = new Float32Array([
            visualBounds.left, visualBounds.bottom, 0,
            visualBounds.left, visualBounds.top, 0,
            visualBounds.left, visualBounds.top, 0,
            visualBounds.right, visualBounds.top, 0,
            visualBounds.right, visualBounds.top, 0,
            visualBounds.right, visualBounds.bottom, 0,
            visualBounds.right, visualBounds.bottom, 0,
            visualBounds.left, visualBounds.bottom, 0
        ]);
        
        const boundaryGeometry = new THREE.BufferGeometry();
        boundaryGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const boundaryMaterial = new THREE.LineBasicMaterial({ 
            color: 0x4488ff,
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        });
        const boundaryBox = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
        boundaryBox.position.z = -0.1;
        this.scene.add(boundaryBox);
        
        // Add corner decorations with adjusted positions
        const cornerSize = 0.5;
        const corners = [
            { x: visualBounds.left, y: visualBounds.top },   // Top-left
            { x: visualBounds.right, y: visualBounds.top },    // Top-right
            { x: visualBounds.right, y: visualBounds.bottom },   // Bottom-right
            { x: visualBounds.left, y: visualBounds.bottom }   // Bottom-left
        ];
        
        corners.forEach(corner => {
            const cornerDecor = new THREE.Mesh(
                new THREE.CircleGeometry(cornerSize, 32),
                new THREE.MeshBasicMaterial({
                    color: 0x4488ff,
                    transparent: true,
                    opacity: 0.4
                })
            );
            cornerDecor.position.set(corner.x, corner.y, -0.2);
            this.scene.add(cornerDecor);
        });
        
        // Add pulsing glow effect
        this.boundaryBox = boundaryBox;
        this.pulseTime = 0;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update bubbles with boundary information
        this.bubbles.forEach(bubble => bubble.update(this.bubbles, this.bounds));
        
        // Animate boundary glow
        this.pulseTime += 0.02;
        const pulseValue = Math.sin(this.pulseTime) * 0.2 + 0.6;
        if (this.boundaryBox) {
            this.boundaryBox.material.opacity = pulseValue;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
new Game(); 