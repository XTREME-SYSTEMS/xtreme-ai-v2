import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ChevronLeft, ChevronRight, X, Loader2, Info, Maximize2, Eye } from "lucide-react";

// Three.js-powered 3D walkthrough viewer. Renders a dark gallery room with
// the current image displayed on a large illuminated panel. Users look
// around with drag/touch and navigate between viewpoints with arrows.
export default function WalkthroughViewer({ viewpoints, title, description, onClose, fullscreen = false }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const panelRef = useRef(null);
  const spotRef = useRef(null);
  const animRef = useRef(null);
  const fadeRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingTex, setLoadingTex] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // ── Three.js scene setup (runs once) ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 15, 35);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 7);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0x333333, 0.6);
    scene.add(ambient);

    const spot = new THREE.SpotLight(0xffffff, 3, 25, Math.PI / 5, 0.4, 1.5);
    spot.position.set(0, 7, 3);
    scene.add(spot);
    scene.add(spot.target);
    spotRef.current = spot;

    const fillLight = new THREE.PointLight(0x88aaff, 0.3, 20);
    fillLight.position.set(-5, 3, 5);
    scene.add(fillLight);

    // ── Room geometry ──
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.4 });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Back wall (where image is displayed)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), wallMat);
    backWall.position.set(0, 8, -8);
    scene.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), wallMat);
    leftWall.position.set(-14, 8, 7);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), wallMat);
    rightWall.position.set(14, 8, 7);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 16;
    scene.add(ceiling);

    // ── Image panel ──
    const panelGeo = new THREE.PlaneGeometry(10, 6);
    const panelMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 4, -7.8);
    scene.add(panel);
    panelRef.current = panel;

    // Subtle frame around the image
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(10.3, 6.3, 0.1), frameMat);
    frame.position.set(0, 4, -7.85);
    scene.add(frame);
    panelRef.current.frame = frame;

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.target.set(0, 4, 0);
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.rotateSpeed = 0.45;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.update();
    controlsRef.current = controls;

    // ── Animation loop ──
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(animRef.current);
      cancelAnimationFrame(fadeRef.current);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []);

  // ── Load texture when index changes ──
  useEffect(() => {
    if (!panelRef.current || !viewpoints[currentIndex]) return;
    const vp = viewpoints[currentIndex];
    setLoadingTex(true);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    loader.load(
      vp.imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;

        const img = texture.image;
        const aspect = img.width / img.height;
        const maxW = 11;
        const maxH = 6.5;
        let w, h;
        if (aspect > maxW / maxH) {
          w = maxW;
          h = maxW / aspect;
        } else {
          h = maxH;
          w = maxH * aspect;
        }

        // Dispose old geometry and create new sized panel
        panelRef.current.geometry.dispose();
        panelRef.current.geometry = new THREE.PlaneGeometry(w, h);
        panelRef.current.position.y = h / 2 + 1.5;

        // Resize frame to match
        if (panelRef.current.frame) {
          panelRef.current.frame.geometry.dispose();
          panelRef.current.frame.geometry = new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.1);
          panelRef.current.frame.position.y = h / 2 + 1.5;
        }

        // Update spotlight target
        if (spotRef.current) {
          spotRef.current.target.position.set(0, h / 2 + 1.5, -7.8);
          spotRef.current.target.updateMatrixWorld();
        }

        // Dispose old texture
        if (panelRef.current.material.map) {
          panelRef.current.material.map.dispose();
        }
        panelRef.current.material.map = texture;
        panelRef.current.material.needsUpdate = true;

        // Fade in
        panelRef.current.material.opacity = 0;
        const startTime = performance.now();
        const fadeIn = () => {
          const elapsed = performance.now() - startTime;
          const opacity = Math.min(elapsed / 600, 1);
          panelRef.current.material.opacity = opacity;
          if (opacity < 1) {
            fadeRef.current = requestAnimationFrame(fadeIn);
          }
        };
        fadeIn();
        setLoadingTex(false);
      },
      undefined,
      () => {
        setLoadingTex(false);
      }
    );
  }, [currentIndex, viewpoints]);

  const goNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, viewpoints.length - 1));
  };
  const goPrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewpoints.length, onClose]);

  const vp = viewpoints[currentIndex];

  return (
    <div className={`relative ${fullscreen ? "fixed inset-0 z-50" : "rounded-xl overflow-hidden"} bg-black`}
      style={fullscreen ? {} : { height: "70vh", minHeight: "500px" }}>
      {/* Three.js mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {loadingTex && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-lime-400" /> Loading view…
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4 pointer-events-none">
        <div className="pointer-events-auto">
          {title && (
            <h2 className="text-lg font-semibold text-white drop-shadow-lg">{title}</h2>
          )}
          {vp && (
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-lime-400/20 px-2.5 py-1 text-xs font-semibold text-lime-300 backdrop-blur-md">
                {currentIndex + 1} / {viewpoints.length}
              </span>
              <span className="text-sm font-medium text-white/80 drop-shadow-lg">{vp.label}</span>
            </div>
          )}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {vp?.description && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:bg-red-500/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info panel */}
      {showInfo && vp?.description && (
        <div className="absolute left-4 top-20 z-10 max-w-xs rounded-xl border border-white/15 bg-black/70 p-4 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-lime-400">{vp.label}</div>
          <p className="mt-1.5 text-sm text-white/80 leading-relaxed">{vp.description}</p>
          {vp.focusPoints && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Focus Points</div>
              <p className="mt-0.5 text-xs text-white/60">{vp.focusPoints}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-lime-400/30 hover:border-lime-400/50"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {currentIndex < viewpoints.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-lime-400/30 hover:border-lime-400/50"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs text-white/50 backdrop-blur-md">
          <Eye className="h-3.5 w-3.5" />
          Drag to look around · Use arrows to navigate
        </div>
      </div>

      {/* Progress dots */}
      {viewpoints.length > 1 && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-1.5">
          {viewpoints.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex ? "w-6 bg-lime-400" : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}