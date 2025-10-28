import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Robust PLY viewer using PLYLoader (supports binary + ASCII) with auth headers.
export default function PLYViewer({ url, height = 320 }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const objectRef = useRef(null);

  // Create renderer, scene, camera, controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return () => {};

    const width = container.clientWidth || 640;
    const heightPx = height;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, heightPx);
    renderer.setClearColor(0xf5f5f5, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / heightPx, 0.01, 5000);
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || width;
      const h = heightPx;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (raf) cancelAnimationFrame(raf);
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      // Dispose loaded object if any
      if (objectRef.current) {
        disposeObject(objectRef.current);
        objectRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [height]);

  // Load PLY with auth headers
  useEffect(() => {
    if (!url || !sceneRef.current) return () => {};

    let canceled = false;
    const scene = sceneRef.current;

    // Remove previous
    if (objectRef.current) {
      scene.remove(objectRef.current);
      disposeObject(objectRef.current);
      objectRef.current = null;
    }

    const loader = new PLYLoader();
    const token = localStorage.getItem('token');
    if (token) loader.setRequestHeader({ Authorization: `Bearer ${token}` });
    loader.setWithCredentials(true);

    loader.load(
      url,
      (geometry) => {
        if (canceled) return;

        // Remove any invalid vertices to avoid NaN bounding spheres
        sanitizeGeometryPositions(geometry);

        // Ensure geometry is valid
        geometry.computeVertexNormals?.();
        const hasColors = !!geometry.getAttribute('color');

        const material = new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: hasColors,
          color: hasColors ? 0xffffff : 0x3366ff,
          sizeAttenuation: true,
        });

        const points = new THREE.Points(geometry, material);
        points.name = 'PLYPointCloud';
        scene.add(points);
        objectRef.current = points;

        // Center and fit camera
        centerAndFrame(points, cameraRef.current, controlsRef.current);
      },
      undefined,
      (err) => {
        // eslint-disable-next-line no-console
        console.error('PLY load error', err);
      },
    );

    return () => {
      canceled = true;
    };
  }, [url]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}

function centerAndFrame(object3D, camera, controls) {
  if (!object3D || !camera) return;
  const box = new THREE.Box3().setFromObject(object3D);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Re-center the object at origin for easier orbiting
  const offset = center.clone().multiplyScalar(-1);
  object3D.position.add(offset);
  if (controls) controls.target.set(0, 0, 0);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fov = (camera.fov * Math.PI) / 180;
  let distance = maxDim / (2 * Math.tan(fov / 2));
  distance *= 1.5; // some padding
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.set(0, 0, distance);
  if (controls) controls.update();
}

function disposeObject(obj) {
  obj.traverse?.((child) => {
    if (child.isMesh || child.isPoints || child.isLine) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
  });
}

function sanitizeGeometryPositions(geometry) {
  const pos = geometry.getAttribute('position');
  if (!pos) return;
  const src = pos.array;
  let valid = 0;
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i];
    const y = src[i + 1];
    const z = src[i + 2];
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) valid += 3;
  }
  if (valid === src.length) return; // all good
  const dst = new Float32Array(valid);
  let p = 0;
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i];
    const y = src[i + 1];
    const z = src[i + 2];
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      dst[p++] = x; dst[p++] = y; dst[p++] = z;
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(dst, 3));
  geometry.deleteAttribute('normal');
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
