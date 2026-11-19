"use client";

import * as React from "react";
import * as THREE from "three";

export function ToothScene() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isSupported, setIsSupported] = React.useState(true);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion or WebGL availability
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setIsSupported(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsSupported(false);
      return;
    }

    // Check WebGL context support
    const testCanvas = document.createElement("canvas");
    let hasWebGL = false;
    try {
      hasWebGL = !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"))
      );
    } catch {
      hasWebGL = false;
    }

    if (!hasWebGL) {
      setIsSupported(false);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setIsSupported(false);
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.6);

    // Group for tooth model + shadow
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Porcelain Ceramic Material
    const porcelainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfcfbfa,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      transmission: 0.15, // Subtle light transmission through porcelain
      thickness: 1.2,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
    });

    const rootMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2ece0,
      roughness: 0.35,
      metalness: 0.02,
    });

    // 1. Crown Base (Molar Body)
    const crownGeo = new THREE.CylinderGeometry(0.85, 0.65, 0.9, 32, 16);
    crownGeo.scale(1.05, 1, 0.95);
    const crown = new THREE.Mesh(crownGeo, porcelainMaterial);
    crown.position.y = 0.25;
    mainGroup.add(crown);

    // 2. Crown Cusps (4 Anatomical Molar Cusps)
    const cuspPositions = [
      [-0.42, 0.72, -0.38],
      [0.42, 0.74, -0.38],
      [-0.45, 0.73, 0.38],
      [0.45, 0.71, 0.38],
    ];

    cuspPositions.forEach(([x, y, z]) => {
      const cuspGeo = new THREE.SphereGeometry(0.38, 24, 24);
      cuspGeo.scale(1, 0.8, 1);
      const cusp = new THREE.Mesh(cuspGeo, porcelainMaterial);
      cusp.position.set(x, y, z);
      mainGroup.add(cusp);
    });

    // 3. Central Fissure Smooth Infill
    const fissureGeo = new THREE.SphereGeometry(0.48, 20, 20);
    fissureGeo.scale(1.1, 0.5, 0.9);
    const fissure = new THREE.Mesh(fissureGeo, porcelainMaterial);
    fissure.position.set(0, 0.6, 0);
    mainGroup.add(fissure);

    // 4. Roots (Dual Anatomical Roots)
    const rootGeo1 = new THREE.ConeGeometry(0.28, 1.25, 24);
    rootGeo1.scale(1, 1, 0.75);
    const root1 = new THREE.Mesh(rootGeo1, rootMaterial);
    root1.position.set(-0.35, -0.65, 0);
    root1.rotation.z = 0.08;
    root1.rotation.y = 0.1;
    mainGroup.add(root1);

    const rootGeo2 = new THREE.ConeGeometry(0.28, 1.25, 24);
    rootGeo2.scale(1, 1, 0.75);
    const root2 = new THREE.Mesh(rootGeo2, rootMaterial);
    root2.position.set(0.35, -0.65, 0);
    root2.rotation.z = -0.08;
    root2.rotation.y = -0.1;
    mainGroup.add(root2);

    // 5. Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(14, 42, 47, 0.28)");
      gradient.addColorStop(0.5, "rgba(14, 42, 47, 0.08)");
      gradient.addColorStop(1, "rgba(14, 42, 47, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.65 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.45;
    scene.add(shadow);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xf7f5f0, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcdebe6, 0.75); // Aqua Mist fill
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc9a66b, 0.6); // Champagne rim
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Mouse Parallax & Scroll Listeners
    let targetX = 0;
    let targetY = 0;
    let scrollRotation = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.35;
      targetY = y * 0.25;
    };

    const handleScroll = () => {
      scrollRotation = window.scrollY * 0.0018;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating motion
      mainGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.08;

      // Smooth mouse interpolation + scroll rotation
      mainGroup.rotation.y += (targetX + scrollRotation + elapsedTime * 0.25 - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetY * 0.4 - mainGroup.rotation.x) * 0.05;

      // Soft shadow breathing
      shadow.scale.setScalar(1 + Math.sin(elapsedTime * 1.4) * 0.05);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      porcelainMaterial.dispose();
      rootMaterial.dispose();
      shadowTex.dispose();
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="w-full h-full min-h-[360px] flex items-center justify-center p-6">
        <div className="relative w-48 h-48 rounded-3xl bg-gradient-to-br from-accent/60 via-card to-background border border-border shadow-md flex items-center justify-center">
          <svg className="w-24 h-24 text-primary opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2C8.5 2 6 5.5 6 9c0 3 1.5 5 2.5 8 .5 1.5 1 4 2 4s1.5-2.5 2-4c1-3 2.5-5 2.5-8 0-3.5-2.5-7-6-7z" />
          </svg>
          <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-card border border-border text-[11px] font-semibold text-primary shadow-xs">
            Precision Ceramics
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] sm:h-[460px] relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      aria-label="Interactive 3D model of a ceramic dental implant crown"
      role="img"
    />
  );
}
