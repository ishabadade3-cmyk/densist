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
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 4.8);

    // Group for tooth model + shadow
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Luxury Porcelain Ceramic Material (Translucent Ivory White)
    const porcelainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfcfbfa,
      roughness: 0.14,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transmission: 0.22,
      thickness: 1.4,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
    });

    // 2. Polished Gold Abutment Material
    const goldAbutmentMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22,
    });

    // 3. Precision Medical Titanium Material
    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3a8,
      metalness: 0.92,
      roughness: 0.28,
    });

    // A. Ceramic Crown (Smooth, contoured anatomical molar)
    const crownGroup = new THREE.Group();

    // Crown core body
    const crownCoreGeo = new THREE.CylinderGeometry(0.82, 0.62, 0.85, 36, 16);
    crownCoreGeo.scale(1.08, 1.0, 0.96);
    const crownCore = new THREE.Mesh(crownCoreGeo, porcelainMaterial);
    crownCore.position.y = 0.55;
    crownGroup.add(crownCore);

    // Crown occlusal dome (rounded, soft cusps)
    const domeGeo = new THREE.SphereGeometry(0.82, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
    domeGeo.scale(1.08, 0.55, 0.96);
    const crownDome = new THREE.Mesh(domeGeo, porcelainMaterial);
    crownDome.position.y = 0.96;
    crownGroup.add(crownDome);

    // Subtle anatomical cusp mounds
    const cuspPositions = [
      [-0.38, 1.08, -0.32],
      [0.38, 1.09, -0.32],
      [-0.40, 1.07, 0.32],
      [0.40, 1.06, 0.32],
    ];

    cuspPositions.forEach(([x, y, z]) => {
      const cuspGeo = new THREE.SphereGeometry(0.24, 20, 20);
      cuspGeo.scale(1.0, 0.65, 1.0);
      const cusp = new THREE.Mesh(cuspGeo, porcelainMaterial);
      cusp.position.set(x, y, z);
      crownGroup.add(cusp);
    });

    mainGroup.add(crownGroup);

    // B. Abutment Collar (Champagne Gold / Precision Fit)
    const abutmentGeo = new THREE.CylinderGeometry(0.58, 0.44, 0.28, 32);
    const abutment = new THREE.Mesh(abutmentGeo, goldAbutmentMaterial);
    abutment.position.y = 0.05;
    mainGroup.add(abutment);

    // C. Titanium Implant Fixture (Threaded Screw Post)
    const fixtureGroup = new THREE.Group();

    const fixturePostGeo = new THREE.CylinderGeometry(0.42, 0.22, 1.25, 32);
    const fixturePost = new THREE.Mesh(fixturePostGeo, titaniumMaterial);
    fixturePost.position.y = -0.7;
    fixtureGroup.add(fixturePost);

    // Threaded titanium micro-grooves
    const threadHeights = [-0.25, -0.42, -0.59, -0.76, -0.93, -1.1];
    const threadRadii = [0.43, 0.41, 0.38, 0.34, 0.30, 0.25];

    threadHeights.forEach((h, i) => {
      const ringGeo = new THREE.TorusGeometry(threadRadii[i], 0.024, 12, 32);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, titaniumMaterial);
      ring.position.y = h;
      fixtureGroup.add(ring);
    });

    // Apex Rounded Tip
    const apexGeo = new THREE.SphereGeometry(0.22, 20, 16);
    const apex = new THREE.Mesh(apexGeo, titaniumMaterial);
    apex.position.y = -1.32;
    fixtureGroup.add(apex);

    mainGroup.add(fixtureGroup);

    // D. Soft Ambient Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(14, 42, 47, 0.32)");
      gradient.addColorStop(0.5, "rgba(14, 42, 47, 0.08)");
      gradient.addColorStop(1, "rgba(14, 42, 47, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.65 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.6;
    scene.add(shadow);

    // E. Multi-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xf7f5f0, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcdebe6, 0.8); // Aqua Mist soft fill
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc9a66b, 0.85); // Champagne luxury rim
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
      scrollRotation = window.scrollY * 0.0016;
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
      mainGroup.position.y = Math.sin(elapsedTime * 1.3) * 0.07;

      // Smooth mouse interpolation + scroll rotation
      mainGroup.rotation.y += (targetX + scrollRotation + elapsedTime * 0.22 - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetY * 0.35 - mainGroup.rotation.x) * 0.05;

      // Soft shadow breathing
      shadow.scale.setScalar(1 + Math.sin(elapsedTime * 1.3) * 0.04);

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
      goldAbutmentMaterial.dispose();
      titaniumMaterial.dispose();
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
