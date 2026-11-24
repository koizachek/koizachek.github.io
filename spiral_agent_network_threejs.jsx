import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SpiralAgentNetwork() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.035);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x050505, 1);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const nodes = [];
    const nodeMeshes = [];
    const activeNodes = [];
    const links = [];

    const rand = (min, max) => min + Math.random() * (max - min);

    function makeBlobGeometry(radius, irregularity = 0.22) {
      const geo = new THREE.IcosahedronGeometry(radius, 3);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const n =
          1 +
          irregularity *
            (Math.sin(v.x * 3.1) + Math.sin(v.y * 4.7) + Math.sin(v.z * 5.3)) /
            3;
        v.multiplyScalar(n);
        pos.setXYZ(i, v.x, v.y, v.z);
      }

      geo.computeVertexNormals();
      return geo;
    }

    function createGlowSprite(size, opacity) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.18, "rgba(255,255,255,0.75)");
      gradient.addColorStop(0.45, "rgba(180,180,180,0.25)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);
      return sprite;
    }

    function makeDetailedBlobMaterial({ shade = 0.55, active = false, seed = 0 }) {
      return new THREE.ShaderMaterial({
        transparent: false,
        uniforms: {
          uTime: { value: 0 },
          uShade: { value: shade },
          uActive: { value: active ? 1.0 : 0.0 },
          uSeed: { value: seed },
        },
        vertexShader: `
          varying vec3 vPos;
          varying vec3 vNormal;
          varying vec2 vUv;

          void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uShade;
          uniform float uActive;
          uniform float uSeed;
          varying vec3 vPos;
          varying vec3 vNormal;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }

          void main() {
            vec2 pixelUv = floor(vUv * 96.0) / 96.0;
            vec2 center = vec2(0.5);
            float d = distance(pixelUv, center);
            float angle = atan(pixelUv.y - 0.5, pixelUv.x - 0.5);

            float rings = smoothstep(0.42, 0.0, abs(sin(d * 72.0 + uSeed * 3.0)));
            float spokes = smoothstep(0.84, 1.0, abs(sin(angle * 10.0 + uSeed)));
            float grain = noise(pixelUv * 80.0 + uSeed);
            float micro = step(0.62, grain);
            float dither = step(fract((gl_FragCoord.x + gl_FragCoord.y) * 0.5), uShade + grain * 0.22);

            float light = dot(normalize(vNormal), normalize(vec3(0.3, 0.45, 1.0))) * 0.5 + 0.5;
            float structure = rings * 0.24 + spokes * 0.12 + micro * 0.17;
            float glow = uActive * (0.35 + 0.22 * sin(uTime * 3.0 + uSeed)) * smoothstep(0.52, 0.0, d);

            float value = uShade * 0.65 + light * 0.24 + structure + glow;
            value *= mix(0.72, 1.12, dither);
            value = clamp(value, 0.02, 1.0);

            gl_FragColor = vec4(vec3(value), 1.0);
          }
        `,
      });
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0xffffff, 2.8, 80);
    keyLight.position.set(4, 4, 12);
    scene.add(keyLight);

    const backLight = new THREE.PointLight(0xffffff, 1.4, 80);
    backLight.position.set(-8, -6, -12);
    scene.add(backLight);

    const totalNodes = 96;
    const turns = 3.35;
    const height = 24;

    for (let i = 0; i < totalNodes; i++) {
      const t = i / (totalNodes - 1);
      const angle = t * Math.PI * 2 * turns;
      const spiralRadius = 2.1 + Math.sin(t * Math.PI * 3) * 1.0 + rand(-0.75, 1.6);

      const x = Math.cos(angle) * spiralRadius + rand(-1.6, 1.6);
      const y = (t - 0.5) * height + rand(-0.55, 0.55);
      const z = Math.sin(angle) * spiralRadius + rand(-2.4, 2.4);
      const r = rand(0.09, 0.42) * (Math.random() > 0.84 ? rand(1.5, 2.4) : 1);
      const active = Math.random() > 0.84;
      const shade = Math.random();

      nodes.push({ id: i, x, y, z, r, active, angle, t });

      const material = makeDetailedBlobMaterial({
        shade: active ? rand(0.72, 0.92) : shade < 0.45 ? rand(0.12, 0.28) : shade < 0.78 ? rand(0.38, 0.58) : rand(0.62, 0.78),
        active,
        seed: rand(0, 1000),
      });

      const mesh = new THREE.Mesh(makeBlobGeometry(r, rand(0.13, 0.36)), material);
      mesh.position.set(x, y, z);
      mesh.userData = { baseScale: rand(0.85, 1.2), pulse: rand(0.5, 1.4), active };
      group.add(mesh);
      nodeMeshes.push(mesh);

      if (active) {
        const glow = createGlowSprite(r * rand(5.5, 8.0), rand(0.22, 0.42));
        glow.position.set(x, y, z);
        group.add(glow);
        activeNodes.push({ mesh, glow, phase: rand(0, Math.PI * 2), base: r });
      }
    }

    function addLink(a, b, opacity = 0.38) {
      const points = [
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(
          (a.x + b.x) / 2 + rand(-0.25, 0.25),
          (a.y + b.y) / 2 + rand(-0.15, 0.15),
          (a.z + b.z) / 2 + rand(-0.25, 0.25)
        ),
        new THREE.Vector3(b.x, b.y, b.z),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(18));
      const material = new THREE.LineBasicMaterial({
        color: 0xcfcfcf,
        transparent: true,
        opacity,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
      links.push(line);
    }

    for (let i = 1; i < nodes.length; i++) {
      addLink(nodes[i - 1], nodes[i], 0.26);
      if (i > 3 && Math.random() > 0.48) addLink(nodes[i - 3], nodes[i], 0.18);
      if (i > 8 && Math.random() > 0.72) addLink(nodes[i - 8], nodes[i], 0.13);
    }

    for (let i = 0; i < 15; i++) {
      const a = nodes[Math.floor(rand(0, nodes.length))];
      const b = nodes[Math.floor(rand(0, nodes.length))];
      if (Math.abs(a.id - b.id) > 10) addLink(a, b, 0.12);
    }

    const particleCount = 5200;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSeeds = [];

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const angle = t * Math.PI * 2 * turns + rand(-0.6, 0.6);
      const radius = rand(1.1, 5.4) + Math.sin(t * Math.PI * 4) * rand(0.1, 1.1);
      particlePositions[i * 3] = Math.cos(angle) * radius + rand(-1.3, 1.3);
      particlePositions[i * 3 + 1] = (t - 0.5) * height + rand(-2.2, 2.2);
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius + rand(-2.2, 2.2);
      particleSeeds.push({ speed: rand(0.08, 0.34), phase: rand(0, 100), amp: rand(0.02, 0.16) });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xe4e4e4,
      size: 0.026,
      transparent: true,
      opacity: 0.62,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const orbitGroup = new THREE.Group();
    group.add(orbitGroup);

    function addOrbit(y, radiusX, radiusZ, rot, opacity) {
      const points = [];
      for (let i = 0; i <= 180; i++) {
        const a = (i / 180) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * radiusX, y + Math.sin(a * 2) * 0.18, Math.sin(a) * radiusZ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineDashedMaterial({
        color: 0xbfbfbf,
        transparent: true,
        opacity,
        dashSize: 0.08,
        gapSize: 0.08,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      line.rotation.y = rot;
      orbitGroup.add(line);
    }

    addOrbit(7.5, 7.2, 2.2, 0.3, 0.28);
    addOrbit(1.2, 6.1, 2.7, -0.8, 0.22);
    addOrbit(-5.4, 5.2, 2.4, 0.9, 0.2);
    addOrbit(-9.0, 4.4, 1.7, -0.35, 0.16);

    let scrollProgress = 0;
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scrollProgress = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const clock = new THREE.Clock();

    function animate() {
      const time = clock.getElapsedTime();
      const pos = particleGeometry.attributes.position;

      group.rotation.y = time * 0.055 + scrollProgress * 1.8;
      group.rotation.x = Math.sin(time * 0.13) * 0.055 + scrollProgress * 0.24;
      group.position.y = (scrollProgress - 0.5) * 3.2;

      nodeMeshes.forEach((mesh, i) => {
        if (mesh.material?.uniforms?.uTime) mesh.material.uniforms.uTime.value = time;
        const pulse = mesh.userData.active ? Math.sin(time * 2.6 + mesh.userData.pulse) * 0.08 : Math.sin(time * 0.9 + i) * 0.025;
        const s = mesh.userData.baseScale + pulse;
        mesh.scale.setScalar(s);
        mesh.rotation.x += 0.002 + i * 0.000004;
        mesh.rotation.y += 0.003;
      });

      activeNodes.forEach(({ glow, phase, base }) => {
        const p = 1 + Math.sin(time * 2.6 + phase) * 0.16;
        glow.scale.setScalar(base * 6.4 * p);
        glow.material.opacity = 0.22 + Math.sin(time * 2.2 + phase) * 0.1;
      });

      for (let i = 0; i < particleCount; i++) {
        const seed = particleSeeds[i];
        const ix = i * 3;
        pos.array[ix] += Math.sin(time * seed.speed + seed.phase) * seed.amp * 0.006;
        pos.array[ix + 2] += Math.cos(time * seed.speed + seed.phase) * seed.amp * 0.006;
      }
      pos.needsUpdate = true;

      links.forEach((line, i) => {
        line.material.opacity = 0.11 + Math.sin(time * 0.9 + i * 0.37) * 0.035;
      });

      orbitGroup.rotation.y = -time * 0.07;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();

    const onResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <main className="min-h-[300vh] bg-neutral-950 text-neutral-100">
      <section className="sticky top-0 h-screen overflow-hidden">
        <div ref={mountRef} className="h-screen w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_54%,rgba(0,0,0,0.72)_100%)]" />
        <div className="pointer-events-none absolute bottom-8 left-8 max-w-md text-xs uppercase tracking-[0.28em] text-neutral-500">
          Scroll-driven multi-agent constellation
        </div>
      </section>
      <section className="h-screen" />
      <section className="h-screen" />
    </main>
  );
}
