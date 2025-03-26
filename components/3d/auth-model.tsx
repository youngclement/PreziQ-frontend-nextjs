"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function AuthModel() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup with game-themed atmosphere
        const scene = new THREE.Scene();
        scene.background = null;

        // Add subtle fog for gaming atmosphere
        scene.fog = new THREE.FogExp2(0x000000, 0.04);

        // Camera setup with game-like view
        const camera = new THREE.PerspectiveCamera(
            50,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 6;
        camera.position.y = 2;
        camera.position.x = 3;

        // Enhanced renderer for game-like visuals
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        containerRef.current.appendChild(renderer.domElement);

        // Dynamic gaming lighting setup
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Directional light with improved shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 5, 4);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.far = 20;
        directionalLight.shadow.mapSize.set(2048, 2048);
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);

        // Gaming-themed colored lights
        const pointLight1 = new THREE.PointLight(0x6366f1, 3, 15); // Indigo
        pointLight1.position.set(-3, 2, 3);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x10b981, 2.5, 10); // Emerald
        pointLight2.position.set(3, 1, 3);
        scene.add(pointLight2);

        // Add a third gaming-themed light
        const pointLight3 = new THREE.PointLight(0xef4444, 2, 12); // Red
        pointLight3.position.set(0, 3, -3);
        scene.add(pointLight3);

        // Create a gaming-themed reflective floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.8,
            roughness: 0.3,
            transparent: true,
            opacity: 0.6
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.5;
        floor.receiveShadow = true;
        scene.add(floor);

        // Create gaming-themed particles (pixels/voxels)
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 800;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Gaming-themed color palette
        const colorPalette = [
            new THREE.Color(0x6366f1), // Indigo
            new THREE.Color(0x10b981), // Emerald
            new THREE.Color(0xef4444), // Red
            new THREE.Color(0xf59e0b), // Amber
            new THREE.Color(0x8b5cf6)  // Violet
        ];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = Math.random() * 10 - 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

            // Random color from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 0.15;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Square particle for pixel-like effect
        const particleCanvas = document.createElement('canvas');
        particleCanvas.width = 64;
        particleCanvas.height = 64;
        const ctx = particleCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 64, 64);
            // Add subtle glow
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
        }

        const particleTexture = new THREE.CanvasTexture(particleCanvas);
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.12,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            map: particleTexture
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        // Enhanced presentation book creation function
        const createPresentationBook = () => {
            const bookGroup = new THREE.Group();

            // Book dimensions
            const width = 3;
            const height = 0.3;
            const depth = 4;

            // Book cover with gaming aesthetics
            const coverGeometry = new THREE.BoxGeometry(width, height, depth);

            // Gaming-themed cover material
            const coverMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x2563eb, // Blue
                roughness: 0.2,
                metalness: 0.3,
                reflectivity: 0.7,
                clearcoat: 0.8,
                clearcoatRoughness: 0.2
            });

            const bottomCover = new THREE.Mesh(coverGeometry, coverMaterial);
            bottomCover.position.y = -height;
            bottomCover.castShadow = true;
            bottomCover.receiveShadow = true;
            bookGroup.add(bottomCover);

            // Create PreziQ logo on the cover
            const addLogoToBook = () => {
                const logoGeometry = new THREE.PlaneGeometry(width * 0.7, depth * 0.3);
                const logoMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    metalness: 0.8,
                    roughness: 0.2,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.3
                });

                // Create logo text on canvas
                const logoCanvas = document.createElement('canvas');
                logoCanvas.width = 512;
                logoCanvas.height = 256;
                const logoCtx = logoCanvas.getContext('2d');

                if (logoCtx) {
                    logoCtx.fillStyle = '#1e40af';
                    logoCtx.fillRect(0, 0, 512, 256);

                    // Logo text
                    logoCtx.font = 'bold 70px Arial';
                    logoCtx.textAlign = 'center';
                    logoCtx.textBaseline = 'middle';

                    // Create gradient for text
                    const gradient = logoCtx.createLinearGradient(0, 0, 512, 0);
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.5, '#f0f9ff');
                    gradient.addColorStop(1, '#ffffff');
                    logoCtx.fillStyle = gradient;

                    // Draw main text
                    logoCtx.fillText('PreziQ', 256, 100);

                    // Draw tagline
                    logoCtx.font = '30px Arial';
                    logoCtx.fillStyle = '#93c5fd';
                    logoCtx.fillText('Game Presentations', 256, 160);

                    // Add gaming controller icon
                    logoCtx.strokeStyle = '#ffffff';
                    logoCtx.lineWidth = 3;
                    logoCtx.beginPath();
                    logoCtx.arc(256, 210, 15, 0, Math.PI * 2);
                    logoCtx.stroke();

                    const texture = new THREE.CanvasTexture(logoCanvas);
                    logoMaterial.map = texture;
                }

                const logo = new THREE.Mesh(logoGeometry, logoMaterial);
                logo.position.set(0, -height / 2 - 0.01, 0);
                logo.rotation.x = -Math.PI / 2;
                return logo;
            };

            bookGroup.add(addLogoToBook());

            // Create pages
            const pagesGroup = new THREE.Group();
            const numPages = 7;
            const pageThickness = 0.04;

            // Create game-themed pages
            for (let i = 0; i < numPages; i++) {
                const pageGeometry = new THREE.BoxGeometry(width - 0.1, pageThickness, depth - 0.1);

                // Create game presentation page design
                const textureCanvas = document.createElement('canvas');
                textureCanvas.width = 1024;
                textureCanvas.height = 1024;
                const ctx = textureCanvas.getContext('2d');

                if (ctx) {
                    // Base color
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(0, 0, 1024, 1024);

                    // Add subtle paper texture
                    ctx.fillStyle = 'rgba(0,0,0,0.03)';
                    for (let n = 0; n < 6000; n++) {
                        ctx.fillRect(
                            Math.random() * 1024,
                            Math.random() * 1024,
                            1,
                            1
                        );
                    }

                    // Draw grid pattern like presentation slides
                    ctx.strokeStyle = 'rgba(100,116,139,0.1)';
                    ctx.lineWidth = 1;

                    // Vertical grid lines
                    for (let x = 0; x < 1024; x += 50) {
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, 1024);
                        ctx.stroke();
                    }

                    // Horizontal grid lines
                    for (let y = 0; y < 1024; y += 50) {
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(1024, y);
                        ctx.stroke();
                    }

                    // Add game-themed content based on page index
                    if (i === 0) {
                        // Title page
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 60px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Game Design', 512, 300);

                        ctx.font = '40px Arial';
                        ctx.fillStyle = '#475569';
                        ctx.fillText('Presentation Template', 512, 380);
                    }
                    else if (i === 1) {
                        // Game mechanics page
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 40px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Game Mechanics', 512, 150);

                        // Draw mechanic boxes
                        const drawBox = (x, y, title) => {
                            ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
                            ctx.fillRect(x, y, 200, 120);
                            ctx.strokeStyle = '#0ea5e9';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, 200, 120);

                            ctx.font = 'bold 20px Arial';
                            ctx.fillStyle = '#0f172a';
                            ctx.textAlign = 'center';
                            ctx.fillText(title, x + 100, y + 30);
                        };

                        drawBox(200, 250, 'Movement');
                        drawBox(500, 250, 'Combat');
                        drawBox(200, 450, 'Leveling');
                        drawBox(500, 450, 'Quests');
                    }
                    else if (i === 2) {
                        // Characters page
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 40px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Characters', 512, 150);

                        // Draw character icons
                        const characterTypes = ['Hero', 'Enemy', 'NPC', 'Boss'];

                        for (let c = 0; c < characterTypes.length; c++) {
                            const x = 200 + (c % 2) * 300;
                            const y = 250 + Math.floor(c / 2) * 200;

                            // Character icon
                            ctx.beginPath();
                            ctx.arc(x + 50, y + 50, 40, 0, Math.PI * 2);
                            ctx.fillStyle = ['#2563eb', '#dc2626', '#ca8a04', '#7e22ce'][c];
                            ctx.fill();

                            // Character name
                            ctx.font = 'bold 24px Arial';
                            ctx.fillStyle = '#0f172a';
                            ctx.textAlign = 'left';
                            ctx.fillText(characterTypes[c], x + 110, y + 40);

                            // Character role
                            ctx.font = '18px Arial';
                            ctx.fillStyle = '#475569';
                            ctx.fillText('Role description', x + 110, y + 70);
                        }
                    }
                    else {
                        // Content pages
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 40px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(`Slide ${i}`, 512, 130);

                        // Add bullet points
                        const points = [
                            "Game design principle",
                            "Core gameplay loop",
                            "Player experience",
                            "Technical implementation"
                        ];

                        ctx.font = '24px Arial';
                        ctx.textAlign = 'left';
                        ctx.fillStyle = '#334155';

                        for (let p = 0; p < points.length; p++) {
                            ctx.fillText(`• ${points[p]}`, 200, 250 + p * 60);
                        }
                    }

                    const texture = new THREE.CanvasTexture(textureCanvas);
                    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

                    const pageMaterial = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        roughness: 0.7,
                        map: texture
                    });

                    const page = new THREE.Mesh(pageGeometry, pageMaterial);
                    page.position.y = i * pageThickness;
                    page.castShadow = true;
                    page.receiveShadow = true;
                    pagesGroup.add(page);
                }
            }

            bookGroup.add(pagesGroup);

            // Create enhanced flipping page with game content
            const flippingPageGeometry = new THREE.BoxGeometry(width - 0.1, pageThickness, depth - 0.1);

            // Create detailed game showcase page
            const textureCanvas = document.createElement('canvas');
            textureCanvas.width = 1024;
            textureCanvas.height = 1024;
            const ctx = textureCanvas.getContext('2d');

            if (ctx) {
                // Base color
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, 1024, 1024);

                // Add paper texture
                ctx.fillStyle = 'rgba(0,0,0,0.03)';
                for (let n = 0; n < 8000; n++) {
                    ctx.fillRect(
                        Math.random() * 1024,
                        Math.random() * 1024,
                        1,
                        1
                    );
                }

                // Draw header
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(0, 0, 1024, 100);

                // Page title
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('PreziQ Game Showcase', 512, 60);

                // Grid layout for game examples
                const games = [
                    { name: "Action RPG", color: "#ef4444" },
                    { name: "Strategy", color: "#22c55e" },
                    { name: "Platformer", color: "#8b5cf6" },
                    { name: "Puzzle", color: "#f59e0b" }
                ];

                // Draw game showcase grid
                for (let i = 0; i < games.length; i++) {
                    const x = 150 + (i % 2) * 350;
                    const y = 150 + Math.floor(i / 2) * 300;

                    // Game box
                    ctx.fillStyle = games[i].color;
                    ctx.fillRect(x, y, 300, 200);

                    // Game icon (simplified)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.beginPath();
                    if (i === 0) { // Sword icon for RPG
                        ctx.moveTo(x + 150, y + 50);
                        ctx.lineTo(x + 170, y + 120);
                        ctx.lineTo(x + 150, y + 110);
                        ctx.lineTo(x + 130, y + 120);
                        ctx.closePath();
                    } else if (i === 1) { // Strategy grid
                        for (let gx = 0; gx < 3; gx++) {
                            for (let gy = 0; gy < 3; gy++) {
                                ctx.fillRect(x + 120 + gx * 20, y + 50 + gy * 20, 15, 15);
                            }
                        }
                    } else if (i === 2) { // Platformer blocks
                        ctx.fillRect(x + 120, y + 80, 20, 20);
                        ctx.fillRect(x + 150, y + 80, 20, 20);
                        ctx.fillRect(x + 180, y + 60, 20, 20);
                    } else { // Puzzle pieces
                        ctx.arc(x + 150, y + 70, 25, 0, Math.PI * 2);
                    }
                    ctx.fill();

                    // Game name
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(games[i].name, x + 150, y + 170);
                }

                // Footer
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, 900, 1024, 124);

                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Create interactive game presentations with PreziQ', 512, 950);

                const texture = new THREE.CanvasTexture(textureCanvas);
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

                const flippingPageMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    roughness: 0.7,
                    map: texture,
                    side: THREE.DoubleSide
                });

                const flippingPage = new THREE.Mesh(flippingPageGeometry, flippingPageMaterial);
                flippingPage.position.y = numPages * pageThickness + pageThickness;
                flippingPage.castShadow = true;
                flippingPage.receiveShadow = true;

                // Create a pivot point at the left side of the page
                const pivot = new THREE.Group();
                pivot.position.x = -width / 2 + 0.05;
                pivot.add(flippingPage);
                flippingPage.position.x = width / 2 - 0.05;

                bookGroup.add(pivot);

                // Store the pivot for animation
                bookGroup.userData = {
                    pivot: pivot,
                    flippingDirection: 1,
                    flippingSpeed: 0.02,
                    maxRotation: Math.PI * 0.75,
                    currentRotation: 0
                };
            }

            return bookGroup;
        };

        const presentationBook = createPresentationBook();
        presentationBook.position.y = -0.5;
        scene.add(presentationBook);

        // Gaming-enhanced orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.minPolarAngle = Math.PI / 4;
        controls.maxPolarAngle = Math.PI / 2;

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current) return;

            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop with game-like effects
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            // Animate book page flipping with gaming-style easing
            const bookData = presentationBook.userData;

            // Update rotation based on direction with easing
            bookData.currentRotation += bookData.flippingSpeed * bookData.flippingDirection;

            // Change direction when reaching limits with slowing at extremes
            if (bookData.currentRotation >= bookData.maxRotation) {
                bookData.flippingDirection = -1;
                bookData.currentRotation = bookData.maxRotation;
                bookData.flippingSpeed = 0.01;
            } else if (bookData.currentRotation <= 0) {
                bookData.flippingDirection = 1;
                bookData.currentRotation = 0;
                bookData.flippingSpeed = 0.01;
            } else {
                // Gradually increase speed in the middle
                bookData.flippingSpeed = Math.min(0.02, bookData.flippingSpeed * 1.01);
            }

            // Apply rotation
            bookData.pivot.rotation.y = bookData.currentRotation;

            // Enhanced floating animation with game-like movement
            presentationBook.position.y = -0.5 +
                Math.sin(elapsedTime * 0.8) * 0.1 +
                Math.sin(elapsedTime * 1.2) * 0.05;

            // Subtle rotation for dynamic effect
            presentationBook.rotation.x = Math.sin(elapsedTime * 0.5) * 0.02;
            presentationBook.rotation.z = Math.sin(elapsedTime * 0.3) * 0.02;

            // Animate particles with gaming style movement
            particles.rotation.y = elapsedTime * 0.05;

            // Move particles in waves
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];

                // Apply wave effect to particles
                positions[i + 1] = y + Math.sin(elapsedTime * 0.5 + x * 0.5) * 0.02;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            // Animate gaming-themed lights
            pointLight1.position.x = Math.sin(elapsedTime * 0.3) * 3;
            pointLight1.position.z = Math.cos(elapsedTime * 0.3) * 3;
            pointLight1.intensity = 2 + Math.sin(elapsedTime) * 1;

            pointLight2.position.x = -Math.sin(elapsedTime * 0.5) * 3;
            pointLight2.position.z = -Math.cos(elapsedTime * 0.5) * 3;
            pointLight2.intensity = 2 + Math.sin(elapsedTime * 1.5) * 1;

            pointLight3.position.y = 3 + Math.sin(elapsedTime * 0.7);
            pointLight3.intensity = 1.5 + Math.sin(elapsedTime * 0.8) * 0.5;

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Clean up
        return () => {
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            window.removeEventListener('resize', handleResize);

            // Dispose of geometries and materials
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();

                    if (object.material instanceof THREE.Material) {
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    }
                }
            });

            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
}