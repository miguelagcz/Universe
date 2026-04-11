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
function Stars({ count, size, speed, explodeTrigger, hue }) {
  const mesh = useRef();
  const exploding = useRef(false);

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;

      // Posiciones
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // 🎨 Colores basados en el hue seleccionado
      const color = new THREE.Color();
      const hueVariation = (hue + (Math.random() - 0.5) * 60 + 360) % 360;
      const saturation = 0.6 + Math.random() * 0.4;
      const lightness = 0.4 + Math.random() * 0.4;

      color.setHSL(hueVariation / 360, saturation, lightness);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Velocidades de explosión
      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    return { positions, colors, velocities, original: positions.slice() };
  }, [count, hue]);
  // Sincronizar explosión
  useEffect(() => {
    exploding.current = explodeTrigger;
  }, [explodeTrigger]);

  useFrame(() => {
    if (!mesh.current) return;


    const pos = mesh.current.geometry.attributes.position.array;

    if (exploding.current) {
      for (let i = 0; i < pos.length; i++) {
        pos[i] += data.velocities[i];
      }
    } else {
      for (let i = 0; i < pos.length; i++) {
        const target = data.original[i];
        pos[i] += (target - pos[i]) * 0.01;
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
        size={size}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}
import { Analytics } from "@vercel/analytics/next"

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




// Inicialización
useEffect(() => {
  ambientSound.current = new Audio("/sounds/ambient.wav");
  ambientSound.current.loop = true;
  ambientSound.current.volume = 0.3;

  clickSound.current = new Audio("/sounds/click.wav");
  clickSound.current.volume = 0.5;
}, []);

// Función para reproducir sonidos
const playSound = (audioRef) => {
  if (soundEnabled && audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }
};

// Activar/Desactivar sonido ambiental
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
  const isMobile = window.innerWidth < 768;

  setConfig({
    count: isMobile ? Math.floor(density / 4) : density,
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
    if (isMobile) setShowControls(false); // Cierra el panel en móvil
  }, 1000);
};



const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
  setShowControls(!isMobile);
}, [isMobile]);



useEffect(() => {
  const checkDevice = () => {
    setIsMobile(window.innerWidth < 768);
  };

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
  const iconStyle = {
  fontSize: "20px",
  transition: "transform 0.3s ease",
};
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

<div
  style={{
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
  }}
></div>
  return (
    
  <div style={{ width: "100%", overflowX: "hidden" }}>
    {/* 🌌 Sección del Universo (pantalla completa) */}
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: `hsla(${hue}, 100%, 60%, 0.15)`,
        border: `1px solid hsla(${hue}, 100%, 70%, 0.4)`,
        boxShadow: `0 0 15px hsla(${hue}, 100%, 70%, 0.4)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 🌌 Botón para generar un nuevo universo */}


{/* 🎛️ Controles de Densidad y Color + Botón */}
<div
  style={{
    position: "absolute",
    top: !isMobile ? "20px" : "auto",
    bottom: isMobile ? "90px" : "auto",
    right: !isMobile ? "20px" : "50%",
    left: isMobile ? "50%" : "auto",
    transform: isMobile
      ? `translateX(-50%) ${showControls ? "translateY(0)" : "translateY(20px)"}`
      : "none",
    opacity: showControls ? 1 : 0,
    pointerEvents: showControls ? "auto" : "none",
    transition: "all 0.35s ease",
    zIndex: 10,
    color: "#ffffff",
    textShadow: "0 0 8px rgba(0,0,0,0.8)",
    padding: isMobile ? "16px" : "18px",
    width: isMobile ? "88%" : "240px",
    maxWidth: "280px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 0 25px rgba(0, 0, 0, 0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  }}
>
  {/* 🔢 Control de Densidad */}
  <label
    style={{
      display: "block",
      fontSize: "0.85rem",
      fontWeight: "600",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.9)",
    }}
  >
    Densidad: <span style={{ opacity: 0.8 }}>{density}</span>
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
        marginTop: "10px",
        background: `linear-gradient(
          90deg,
          hsl(${hue}, 100%, 40%),
          hsl(${hue}, 100%, 60%),
          hsl(${hue}, 100%, 80%)
        )`,
        boxShadow: `0 0 10px hsla(${hue}, 100%, 60%, 0.6)`,
      }}
    />
  </label>

  {/* 🎨 Control de Color */}
  <label
    style={{
      display: "block",
      fontSize: "0.85rem",
      fontWeight: "600",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.9)",
    }}
  >
    Color: <span style={{ opacity: 0.8 }}>{Math.round(hue)}°</span>
    <input
      type="range"
      min="0"
      max="360"
      value={hue}
      onChange={(e) => setHue(Number(e.target.value))}
      className="cosmic-slider"
      style={{
        width: "100%",
        marginTop: "10px",
        background: `linear-gradient(
          90deg,
          hsl(0, 100%, 60%),
          hsl(60, 100%, 60%),
          hsl(120, 100%, 60%),
          hsl(180, 100%, 60%),
          hsl(240, 100%, 60%),
          hsl(300, 100%, 60%),
          hsl(360, 100%, 60%)
        )`,
        boxShadow: `0 0 12px hsla(${hue}, 100%, 60%, 0.7)`,
      }}
    />
  </label>

  {/* 🌌 Botón para generar un nuevo universo */}
  <button
    onClick={handleNewUniverse}
    style={{
      marginTop: "10px",
      padding: "12px 18px",
      background: `hsla(${hue}, 100%, 60%, 0.15)`,
      color: "#ffffff",
      border: `1px solid hsla(${hue}, 100%, 70%, 0.4)`,
      borderRadius: "999px",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      transition: "all 0.3s ease",
      boxShadow: `0 0 15px hsla(${hue}, 100%, 70%, 0.4)`,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      width: "100%",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "scale(1.05)";
      e.currentTarget.style.boxShadow = `0 0 25px hsla(${hue}, 100%, 70%, 0.8)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = `0 0 15px hsla(${hue}, 100%, 70%, 0.4)`;
    }}
  >
    Nuevo Universo
  </button>

{/* 🔊 Botón de Encendido/Apagado de Sonido */}
<button
  onClick={toggleSound}
  style={{
    marginTop: "6px",
    padding: "12px 18px",
    background: `hsla(${hue}, 100%, 60%, ${soundEnabled ? 0.25 : 0.1})`,
    color: "#ffffff",
    border: `1px solid hsla(${hue}, 100%, 70%, 0.4)`,
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    transition: "all 0.3s ease",
    boxShadow: soundEnabled
      ? `0 0 20px hsla(${hue}, 100%, 70%, 0.8)`
      : `0 0 10px hsla(${hue}, 100%, 70%, 0.3)`,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = `0 0 25px hsla(${hue}, 100%, 70%, 0.9)`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = soundEnabled
      ? `0 0 20px hsla(${hue}, 100%, 70%, 0.8)`
      : `0 0 10px hsla(${hue}, 100%, 70%, 0.3)`;
  }}
>
  <span style={{ fontSize: "1.1rem" }}>
    {soundEnabled ? "🎧" : "✖️"}
  </span>
  {soundEnabled ? "Sound On" : "Sound Off"}
</button>
</div>
{/* ⚙️ Botón flotante para mostrar/ocultar controles en móvil */}
{isMobile && (
  <button
    onClick={() => setShowControls(!showControls)}
    style={{
      position: "absolute",
      bottom: "20px",
      right: "20px",
      zIndex: 20,
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      border: `1px solid hsla(${hue}, 100%, 70%, 0.5)`,
      background: `hsla(${hue}, 100%, 60%, 0.2)`,
      color: "#fff",
      fontSize: "1.4rem",
      cursor: "pointer",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      boxShadow: `0 0 20px hsla(${hue}, 100%, 70%, 0.6)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
    }}
    aria-label="Mostrar controles"
  >
    {showControls ? "✕" : "👾"}
  </button>
)}
      {/* 🌌 Escena 3D */}
      <Canvas
        camera={{ position: [0, 0, 10] }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <color attach="background" args={[`hsl(${hue}, 50%, 5%)`]} />
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


{/* 🌌 Sección del Proyecto */}
<section
  style={{
    minHeight: "100vh",
    background: "linear-gradient(180deg, #000000 0%, #020617 50%, #000000 100%)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "80px 20px",
  }}
>
  {/* ✨ Título del Proyecto */}
  <h2
    style={{
      fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
      marginBottom: "20px",
      fontWeight: "700",
      letterSpacing: "2px",
      background: "linear-gradient(90deg, #ffffff, #a5b4fc, #ffffff)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow: "0 0 15px rgba(165, 180, 252, 0.4)",
    }}
  >
    Galactic Flow
  </h2>

  {/* 🌟 Línea decorativa */}
  <div
    style={{
      width: "80px",
      height: "3px",
      marginBottom: "30px",
      borderRadius: "999px",
      background: "linear-gradient(90deg, transparent, #a5b4fc, transparent)",
    }}
  />

  {/* 📝 Descripción */}
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
   "What you’re witnessing is a digital universe in constant evolution.
    The procedurally generated stars represent the vastness and dynamism 
    of the cosmos. Through interaction, users can transform their structure, 
    colors, and density, creating an immersive experience that invites exploration 
    and discovery."
  </p>

  {/* 🔗 Contenedor de redes sociales */}
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
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      © {new Date().getFullYear()} MiguelCruz. All rights reserved.
    </footer>
    <analytics/>
  </div>
);
}



