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
        
        // Add base speed property
        this.baseSpeed = 0.03;
        // Initialize velocity with base speed
        this.velocity = {
            x: (Math.random() - 0.5) * this.baseSpeed,
            y: (Math.random() - 0.5) * this.baseSpeed
        };
        
        // Add small bubble decorations
        this.addBubbleDecorations(scene);
        
        this.letter = letter;
        
        // Add radius property for collision detection
        this.radius = 0.8; // Match with circle geometry size
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
        if (speed > this.baseSpeed) {
            // Normalize velocity back to base speed
            this.velocity.x = (this.velocity.x / speed) * this.baseSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.baseSpeed;
        }
    }
    
    update(otherBubbles) {
        // Store previous position for collision resolution
        const prevX = this.mesh.position.x;
        const prevY = this.mesh.position.y;
        
        // Update position
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.y += this.velocity.y;
        
        // Bounce off walls with some padding
        if (Math.abs(this.mesh.position.x) > 8) {
            this.velocity.x *= -1;
            this.mesh.position.x = Math.sign(this.mesh.position.x) * 8;
        }
        if (Math.abs(this.mesh.position.y) > 6) {
            this.velocity.y *= -1;
            this.mesh.position.y = Math.sign(this.mesh.position.y) * 6;
        }
        
        // Check collisions with other bubbles
        otherBubbles.forEach(otherBubble => {
            if (otherBubble !== this) {
                const dx = this.mesh.position.x - otherBubble.mesh.position.x;
                const dy = this.mesh.position.y - otherBubble.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = this.radius + otherBubble.radius;
                
                if (distance < minDistance) {
                    // Collision detected - move bubbles apart
                    const angle = Math.atan2(dy, dx);
                    
                    // Move bubbles apart
                    this.mesh.position.x = otherBubble.mesh.position.x + Math.cos(angle) * minDistance;
                    this.mesh.position.y = otherBubble.mesh.position.y + Math.sin(angle) * minDistance;
                    
                    // Calculate new velocities (elastic collision)
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    
                    const p = 2 * (this.velocity.x * normalX + this.velocity.y * normalY);
                    
                    // Update velocities
                    this.velocity.x = this.velocity.x - p * normalX;
                    this.velocity.y = this.velocity.y - p * normalY;
                    otherBubble.velocity.x = otherBubble.velocity.x + p * normalX;
                    otherBubble.velocity.y = otherBubble.velocity.y + p * normalY;
                    
                    // Normalize velocities after collision
                    this.normalizeVelocity();
                    otherBubble.normalizeVelocity();
                }
            }
        });
        
        // Normalize velocity after wall collisions too
        if (Math.abs(this.mesh.position.x) > 8 || Math.abs(this.mesh.position.y) > 6) {
            this.normalizeVelocity();
        }
        
        // Rotate decorative bubbles
        this.decorations.forEach((decoration, i) => {
            decoration.rotation.z += 0.01 * (i + 1);
        });
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
        
        // Initialize bubbles
        this.bubbles = [];
        for (let i = 0; i < this.availableLetters.length; i++) {
            this.bubbles.push(new Bubble(this.scene, this.availableLetters[i]));
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
        // Adjust bubble sizes to 80% of original
        const baseScale = this.isMobile ? 1.44 : 0.96; // 80% of 1.8/1.2
        bubble.letterSprite.scale.set(baseScale, baseScale, 1);
        bubble.mesh.scale.set(1.2, 1.2, 1); // 80% of 1.5
        
        // Adjust decoration sizes
        bubble.decorations.forEach(decoration => {
            decoration.scale.set(1.2, 1.2, 1); // 80% of 1.5
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
            this.bubbles.push(new Bubble(this.scene, this.availableLetters[i]));
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
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update bubble positions with collision detection
        this.bubbles.forEach(bubble => bubble.update(this.bubbles));
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
new Game(); 