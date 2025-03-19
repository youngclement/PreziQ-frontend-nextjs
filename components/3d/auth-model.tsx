"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Note the .js extension

export default function AuthModel() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = null; // transparent background

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            45,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true // transparent background
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 2);
        scene.add(directionalLight);

        // Create shapes for a presentation icon
        const createPresentationIcon = () => {
            const group = new THREE.Group();

            // Create slide deck base (rectangle)
            const slideGeometry = new THREE.BoxGeometry(3, 2, 0.1);
            const slideMaterial = new THREE.MeshStandardMaterial({
                color: 0x6366f1,
                metalness: 0.3,
                roughness: 0.4,
            });
            const slide = new THREE.Mesh(slideGeometry, slideMaterial);
            group.add(slide);

            // Create slide decoration lines
            const decorationMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

            // Title line
            const titleGeometry = new THREE.BoxGeometry(2, 0.1, 0.11);
            const titleLine = new THREE.Mesh(titleGeometry, decorationMaterial);
            titleLine.position.y = 0.6;
            titleLine.position.z = 0.06;
            group.add(titleLine);

            // Content lines
            for (let i = 0; i < 3; i++) {
                const lineGeometry = new THREE.BoxGeometry(2, 0.08, 0.11);
                const line = new THREE.Mesh(lineGeometry, decorationMaterial);
                line.position.y = 0.2 - (i * 0.3);
                line.position.z = 0.06;
                group.add(line);
            }

            return group;
        };

        const presentationIcon = createPresentationIcon();
        scene.add(presentationIcon);

        // Add orbit controls for interaction
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;

        // Auto-rotate the model
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1;

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current) return;

            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Add slight floating animation
            presentationIcon.position.y = Math.sin(Date.now() * 0.001) * 0.1;

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
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
}