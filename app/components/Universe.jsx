"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { FaInstagram, FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";

/* 🎥 Controlador de cámara */
function CameraController({ pointer }) {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame(() => {
    target.current.x = (pointer.current.x - 0.5) * 4;
    target.current.y = (pointer.current.y - 0.5) * 2;
    camera.position.x += (target.current.x - camera.position.x) * 0.05;
    camera.position.y += (-target.current.y - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* 🌟 Componente de estrellas */
function Stars({ count, size, speed, explodeTrigger, hue, isNew }) {
  const mesh = useRef();
  const exploding = useRef(false);
  // Control de opacidad para entrada suave al generar nuevo universo
  const opacity = useRef(0);
  const fadingIn = useRef(false);
  const matRef = useRef();

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // 📍 Posiciones en espiral
      const arm = Math.floor(Math.random() * 3);
      const armAngle = (arm / 3) * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.5) * 20;
      const spin = radius * 0.4;
      const scatter = (Math.random() - 0.5) * (radius * 0.4 + 0.5);
      const angle = armAngle + spin + scatter;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (1.5 - radius * 0.05);
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // 🎨 Colores
      const color = new THREE.Color();
      const hueVariation = (hue + (Math.random() - 0.5) * 60 + 360) % 360;
      const saturation = 0.7 + Math.random() * 0.3;
      const lightness = 0.5 + Math.random() * 0.4;
      color.setHSL(hueVariation / 360, saturation, lightness);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // ⚡ Velocidades de explosión en esfera 3D
      const explosionSpeed = 0.08 + Math.random() * 0.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * explosionSpeed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * explosionSpeed;
      velocities[i * 3 + 2] = Math.cos(phi) * explosionSpeed;
    }

    return { positions, colors, velocities, original: positions.slice() };
  }, [count, hue]);

  // Al montar componente nuevo, arranca fade in lento
  useEffect(() => {
    opacity.current = 0;
    fadingIn.current = true;
  }, []);

  useEffect(() => {
    exploding.current = explodeTrigger;
  }, [explodeTrigger]);

  useFrame(() => {
    if (!mesh.current) return;

    // Fade in suave al aparecer nuevo universo
    if (fadingIn.current) {
      opacity.current = Math.min(opacity.current + 0.004, 0.85);
      if (matRef.current) matRef.current.opacity = opacity.current;
      if (opacity.current >= 0.85) fadingIn.current = false;
    }

    const pos = mesh.current.geometry.attributes.position.array;

    if (exploding.current) {
      // 💥 Explosión
      for (let i = 0; i < count; i++) {
        pos[i * 3] += data.velocities[i * 3];
        pos[i * 3 + 1] += data.velocities[i * 3 + 1] * 0.95;
        pos[i * 3 + 2] += data.velocities[i * 3 + 2];
      }
    } else {
      // 🔄 Regreso LENTO y suave
      for (let i = 0; i < pos.length; i++) {
        const target = data.original[i];
        pos[i] += (target - pos[i]) * 0.008;
      }
      mesh.current.rotation.y += speed;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={data.positions}
          count={data.positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={data.colors}
          count={data.colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={size}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

import { Analytics } from "@vercel/analytics/next";

/* 🌌 Componente principal */
export default function Universe() {
  const [config, setConfig] = useState(null);
  const [explode, setExplode] = useState(false);
  const [density, setDensity] = useState(2000);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const [colorSeed, setColorSeed] = useState(Math.random());
  const [hue, setHue] = useState(Math.random() * 360);
  const ambientSound = useRef(null);
  const clickSound = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    ambientSound.current = new Audio("/sounds/ambient.wav");
    ambientSound.current.loop = true;
    ambientSound.current.volume = 0.3;
    clickSound.current = new Audio("/sounds/click.wav");
    clickSound.current.volume = 0.5;
  }, []);

  const playSound = (audioRef) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const newState = !prev;
      if (newState) {
        ambientSound.current?.play().catch(() => {});
      } else {
        ambientSound.current?.pause();
      }
      return newState;
    });
  };

  const generateUniverse = () => {
    const mobile = window.innerWidth < 768;
    setConfig({
      count: mobile ? Math.floor(density / 4) : density,
      size: Math.random() * 0.05 + 0.01,
      speed: Math.random() * 0.002 + 0.0005,
      seed: Math.random(),
    });
  };

  const handleNewUniverse = () => {
    playSound(clickSound);
    setExplode(true);
    setTimeout(() => {
      setExplode(false);
      setHue(Math.random() * 360);
      generateUniverse();
      setShowControls(false);
    }, 1000);
  };

  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    generateUniverse();
    const handleMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        pointer.current.x = e.touches[0].clientX / window.innerWidth;
        pointer.current.y = e.touches[0].clientY / window.innerHeight;
      } else {
        pointer.current.x = e.clientX / window.innerWidth;
        pointer.current.y = e.clientY / window.innerHeight;
      }
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [density]);

  if (!config) return null;

  const iconStyle = { fontSize: "20px", transition: "transform 0.3s ease" };

  const socialButtonStyle = {
    padding: "14px 28px",
    borderRadius: "999px",
    textDecoration: "none",
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: "0.5px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    transition: "all 0.35s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    position: "relative",
    boxShadow: "0 0 12px rgba(255, 255, 255, 0.25)",
  };

  const socialButtonHoverStyle = {
    transform: "scale(1.1)",
    background: "rgba(255, 255, 255, 0.12)",
    boxShadow:
      "0 0 15px rgba(255,255,255,0.9), 0 0 35px rgba(255,255,255,0.7), 0 0 70px rgba(255,255,255,0.5)",
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>

      {/* ── Estilos globales ── */}
      <style>{`
        .cosmic-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          display: block;
        }
        .cosmic-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px rgba(255,255,255,0.8);
          cursor: pointer;
        }
        .cosmic-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px rgba(255,255,255,0.8);
          border: none;
          cursor: pointer;
        }

        /* Panel de controles */
        .ctrl-panel {
          position: absolute;
          z-index: 10;
          color: #fff;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: rgba(10, 10, 20, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1), visibility 0.4s;
        }

        /* PC: esquina superior derecha */
        @media (min-width: 768px) {
          .ctrl-panel {
            top: 20px;
            right: 20px;
            width: 230px;
          }
          .ctrl-panel.hidden {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
            visibility: hidden;
            pointer-events: none;
          }
          .ctrl-panel.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
            visibility: visible;
            pointer-events: auto;
          }
        }

        /* Móvil: desde abajo centrado */
        @media (max-width: 767px) {
          .ctrl-panel {
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            width: 88%;
            max-width: 320px;
          }
          .ctrl-panel.hidden {
            opacity: 0;
            transform: translateX(-50%) translateY(28px);
            visibility: hidden;
            pointer-events: none;
          }
          .ctrl-panel.visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
            visibility: visible;
            pointer-events: auto;
          }
        }

        /* Botón flotante toggle */
        .toggle-btn {
          position: absolute;
          z-index: 20;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #fff;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        /* PC: botón pequeño arriba derecha */
        @media (min-width: 768px) {
          .toggle-btn {
            top: 20px;
            right: 20px;
            width: auto;
            height: 40px;
            padding: 0 18px;
            border-radius: 999px;
            font-size: 0.8rem;
          }
          /* cuando panel visible, el botón se mueve para no chocar */
          .toggle-btn.panel-open {
            top: 20px;
            right: 268px;
          }
        }

        /* Móvil: botón abajo derecha */
        @media (max-width: 767px) {
          .toggle-btn {
            bottom: 20px;
            right: 20px;
            width: 52px;
            height: 52px;
            font-size: 1.3rem;
          }
        }

        .ctrl-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ctrl-label span {
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          letter-spacing: 0;
          font-size: 0.8rem;
        }

        .ctrl-btn {
          width: 100%;
          padding: 11px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.25s ease;
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
        }
        .ctrl-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .ctrl-btn:active {
          transform: translateY(0px);
        }
        .ctrl-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 2px 0;
        }
      `}</style>

      {/* 🌌 Sección del Universo */}
      <div
        style={{
          width: "100%",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          // Borde orgánico con gradiente sutil — sin el borde duro de color
          background: "#000",
        }}
      >
        {/* Resplandor ambiental orgánico (reemplaza el borde de color) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            // Viñeta perimetral que sigue el hue — orgánica, sin borde duro
            background: `
              radial-gradient(ellipse 120% 60% at 50% 0%, hsla(${hue}, 80%, 55%, 0.12) 0%, transparent 70%),
              radial-gradient(ellipse 120% 60% at 50% 100%, hsla(${(hue + 40) % 360}, 80%, 55%, 0.08) 0%, transparent 70%),
              radial-gradient(ellipse 60% 120% at 0% 50%, hsla(${(hue + 20) % 360}, 80%, 55%, 0.06) 0%, transparent 70%),
              radial-gradient(ellipse 60% 120% at 100% 50%, hsla(${(hue + 60) % 360}, 80%, 55%, 0.06) 0%, transparent 70%)
            `,
          }}
        />

        {/* ── Botón toggle (PC y móvil) ── */}
        <button
          onClick={() => setShowControls((v) => !v)}
          className={`toggle-btn ${showControls ? "panel-open" : ""}`}
          style={{
            boxShadow: showControls
              ? `0 0 20px hsla(${hue}, 100%, 70%, 0.3)`
              : "none",
          }}
          aria-label="Mostrar controles"
        >
          {isMobile
            ? showControls ? "✕" : "⚙️"
            : showControls ? "✕ Close" : "⚙ Controls"}
        </button>

        {/* ── Panel de controles ── */}
        <div className={`ctrl-panel ${showControls ? "visible" : "hidden"}`}>

          {/* Densidad */}
          <div>
            <div className="ctrl-label">
              Density <span>{density}</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="cosmic-slider"
              style={{
                width: "100%",
                background: `linear-gradient(90deg, hsl(${hue},100%,35%), hsl(${hue},100%,65%))`,
              }}
            />
          </div>

          <div className="ctrl-divider" />

          {/* Color */}
          <div>
            <div className="ctrl-label">
              Color <span>{Math.round(hue)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              className="cosmic-slider"
              style={{
                width: "100%",
                background:
                  "linear-gradient(90deg,hsl(0,100%,60%),hsl(60,100%,60%),hsl(120,100%,60%),hsl(180,100%,60%),hsl(240,100%,60%),hsl(300,100%,60%),hsl(360,100%,60%))",
              }}
            />
          </div>

          <div className="ctrl-divider" />

          {/* New Universe */}
          <button
            className="ctrl-btn"
            onClick={handleNewUniverse}
            style={{
              background: `hsla(${hue}, 100%, 60%, 0.12)`,
              borderColor: `hsla(${hue}, 100%, 70%, 0.35)`,
              boxShadow: `0 0 18px hsla(${hue}, 100%, 60%, 0.2)`,
            }}
          >
            ✦ New Universe
          </button>

          {/* Sound */}
          <button
            className="ctrl-btn"
            onClick={toggleSound}
            style={{
              background: soundEnabled
                ? `hsla(${hue}, 100%, 60%, 0.2)`
                : "rgba(255,255,255,0.04)",
              borderColor: soundEnabled
                ? `hsla(${hue}, 100%, 70%, 0.4)`
                : "rgba(255,255,255,0.1)",
            }}
          >
            {soundEnabled ? "🎧 Sound On" : "✖ Sound Off"}
          </button>
        </div>

        {/* 🌌 Escena 3D */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Canvas
            camera={{ position: [0, 0, 10] }}
            gl={{ preserveDrawingBuffer: true }}
          >
            <color attach="background" args={[`hsl(${hue}, 30%, 3%)`]} />
            <CameraController pointer={pointer} />
            <Stars
              key={`${config.seed}-${colorSeed}`}
              count={config.count}
              size={config.size}
              speed={config.speed}
              explodeTrigger={explode}
              hue={hue}
            />
            <EffectComposer>
              <Bloom
                intensity={1.5}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
              />
            </EffectComposer>
          </Canvas>
        </div>
      </div>

      {/* 🌌 Sección del Proyecto */}
      <section
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #000000 0%, #020617 50%, #000000 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 20px",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
            marginBottom: "20px",
            fontWeight: "700",
            letterSpacing: "2px",
            background: "linear-gradient(90deg, #ffffff, #a5b4fc, #ffffff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Galactic Flow
        </h2>

        <div
          style={{
            width: "80px",
            height: "3px",
            marginBottom: "30px",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, transparent, #a5b4fc, transparent)",
          }}
        />

        <p
          style={{
            maxWidth: "650px",
            fontSize: "1.15rem",
            lineHeight: "1.8",
            marginBottom: "40px",
            opacity: 0.9,
            color: "rgba(255, 255, 255, 0.85)",
          }}
        >
          "What you're witnessing is a digital universe in constant evolution.
          The procedurally generated stars represent the vastness and dynamism
          of the cosmos. Through interaction, users can transform their
          structure, colors, and density, creating an immersive experience that
          invites exploration and discovery."
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {[
            {
              href: "https://www.miguelcruz.site",
              icon: <FaGlobe style={iconStyle} />,
              label: "Mi Web",
            },
            {
              href: "https://www.instagram.com/miguelczarr/?hl=es-la",
              icon: <FaInstagram style={iconStyle} />,
              label: "Instagram",
            },
            {
              href: "https://www.linkedin.com/in/miguel-cruz-3715913ba/?skipRedirect=true",
              icon: <FaLinkedin style={iconStyle} />,
              label: "LinkedIn",
            },
            {
              href: "https://github.com/miguelagcz",
              icon: <FaGithub style={iconStyle} />,
              label: "GitHub",
            },
          ].map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                ...socialButtonStyle,
                ...(hoveredIndex === index ? socialButtonHoverStyle : {}),
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                justifyContent: "center",
                padding: "0",
              }}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </section>

      {/* 📌 Footer */}
      <footer
        style={{
          background: "#000000",
          color: "rgba(255,255,255,0.7)",
          textAlign: "center",
          padding: "20px",
          fontSize: "0.9rem",
          borderTop: "1px solid rgba(241, 122, 122, 0.1)",
        }}
      >
        © {new Date().getFullYear()} MiguelCruz. All rights reserved.
      </footer>
      <Analytics />
    </div>
  );
}
