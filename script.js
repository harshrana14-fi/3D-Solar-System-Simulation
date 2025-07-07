class SolarSystem {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.planets = [];
    this.sun = null;
    this.clock = new THREE.Clock();
    this.isPaused = false;
    this.showLabels = false;
    this.labels = [];

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredPlanet = null;

    this.planetData = [
      {
        name: "Mercury",
        size: 0.4,
        distance: 12,
        color: 0x8c7853,
        speed: 4.0,
        realDistance: "57.9 million km",
        period: "88 Earth days",
        diameter: "4,879 km",
      },
      {
        name: "Venus",
        size: 0.9,
        distance: 16,
        color: 0xff6b47,
        speed: 1.6,
        realDistance: "108.2 million km",
        period: "225 Earth days",
        diameter: "12,104 km",
      },
      {
        name: "Earth",
        size: 1,
        distance: 20,
        color: 0x4f94cd,
        speed: 1.0,
        realDistance: "149.6 million km",
        period: "365 Earth days",
        diameter: "12,756 km",
      },
      {
        name: "Mars",
        size: 0.5,
        distance: 26,
        color: 0xcd5c5c,
        speed: 0.5,
        realDistance: "227.9 million km",
        period: "687 Earth days",
        diameter: "6,792 km",
      },
      {
        name: "Jupiter",
        size: 2.5,
        distance: 35,
        color: 0xd2691e,
        speed: 0.08,
        realDistance: "778.3 million km",
        period: "11.9 Earth years",
        diameter: "142,984 km",
      },
      {
        name: "Saturn",
        size: 2.1,
        distance: 45,
        color: 0xfad5a5,
        speed: 0.03,
        realDistance: "1.4 billion km",
        period: "29.5 Earth years",
        diameter: "120,536 km",
      },
      {
        name: "Uranus",
        size: 1.5,
        distance: 55,
        color: 0x4fd0e3,
        speed: 0.01,
        realDistance: "2.9 billion km",
        period: "84 Earth years",
        diameter: "51,118 km",
      },
      {
        name: "Neptune",
        size: 1.4,
        distance: 65,
        color: 0x4169e1,
        speed: 0.006,
        realDistance: "4.5 billion km",
        period: "165 Earth years",
        diameter: "49,528 km",
      },
    ];

    this.init();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLights();
    this.createStars();
    this.createSun();
    this.createPlanets();
    this.createControls();
    this.setupEventListeners();
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 30, 70);
    this.camera.lookAt(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document
      .getElementById("canvas-container")
      .appendChild(this.renderer.domElement);
  }

  createLights() {
    const sunLight = new THREE.PointLight(0xffffff, 2, 200);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
  }

  createStars() {
    const starCount = 8000;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    const starVertices = [];
    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  createSun() {
    const textureLoader = new THREE.TextureLoader();
    const sunGeometry = new THREE.SphereGeometry(4, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      map: textureLoader.load("textures/sun.jpg"),
      emissive: 0xffaa00,
      emissiveIntensity: 1.2,
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.userData = { type: "sun" };
    this.scene.add(this.sun);
  }

  createPlanets() {
    const textureLoader = new THREE.TextureLoader();
    this.planetData.forEach((data, index) => {
      const geometry = new THREE.SphereGeometry(data.size, 64, 64);
      const texture = textureLoader.load(
        `textures/${data.name.toLowerCase()}.jpg`
      );
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 20,
      });
      const planet = new THREE.Mesh(geometry, material);
      planet.castShadow = true;
      planet.receiveShadow = true;
      planet.position.x = data.distance;
      planet.userData = { type: "planet", index, name: data.name, data };

      const orbitGroup = new THREE.Group();
      orbitGroup.add(planet);
      this.scene.add(orbitGroup);

      const orbitGeometry = new THREE.RingGeometry(
        data.distance - 0.05,
        data.distance + 0.05,
        128
      );
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = Math.PI / 2;
      this.scene.add(orbitLine);

      if (["Earth", "Jupiter", "Saturn"].includes(data.name)) {
        const atmosphereGeo = new THREE.SphereGeometry(
          data.size * 1.05,
          64,
          64
        );
        const atmosphereMat = new THREE.MeshPhongMaterial({
          color: data.color,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
        });
        const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        planet.add(atmosphere);
      }

      if (data.name === "Saturn") {
        const ringGeo = new THREE.RingGeometry(
          data.size * 1.2,
          data.size * 2,
          64
        );
        const ringMat = new THREE.MeshBasicMaterial({
          map: textureLoader.load("textures/saturn_ring.png"),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
      }

      this.planets.push({
        mesh: planet,
        orbitGroup,
        orbitLine,
        data,
        angle: Math.random() * Math.PI * 2,
        currentSpeed: data.speed,
        trail: null,
        trailPoints: [],
      });
    });
  }

  createLabels() {
    this.planets.forEach((planet) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = 200;
      canvas.height = 50;

      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "#87ceeb";
      context.font = "bold 18px Arial";
      context.textAlign = "center";
      context.fillText(
        planet.data.name,
        canvas.width / 2,
        canvas.height / 2 + 6
      );

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(6, 1.5, 1);
      sprite.position.copy(planet.mesh.position);
      sprite.position.y += planet.data.size + 2;

      planet.label = sprite;
      this.scene.add(sprite);
    });
  }

  removeLabels() {
    this.planets.forEach((planet) => {
      if (planet.label) {
        this.scene.remove(planet.label);
        planet.label = null;
      }
    });
  }

  createControls() {
    const controlsContainer = document.getElementById("planet-controls");
    this.planets.forEach((planet, index) => {
      const controlGroup = document.createElement("div");
      controlGroup.className = "control-group";

      const label = document.createElement("label");
      label.textContent = planet.data.name;

      const controlRow = document.createElement("div");
      controlRow.className = "control-row";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "5";
      slider.step = "0.1";
      slider.value = planet.data.speed;
      slider.id = `speed-${index}`;

      const speedValue = document.createElement("span");
      speedValue.className = "speed-value";
      speedValue.textContent = `${planet.data.speed.toFixed(1)}x`;

      slider.addEventListener("input", (e) => {
        const newSpeed = parseFloat(e.target.value);
        planet.currentSpeed = newSpeed;
        speedValue.textContent = `${newSpeed.toFixed(1)}x`;
      });

      controlRow.appendChild(slider);
      controlRow.appendChild(speedValue);
      controlGroup.appendChild(label);
      controlGroup.appendChild(controlRow);
      controlsContainer.appendChild(controlGroup);
    });
  }

  setupEventListeners() {
    // Touch Zoom Support
    let lastTouchDist = null;

    this.renderer.domElement.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    });

    this.renderer.domElement.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && lastTouchDist !== null) {
        e.preventDefault();

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);

        const delta = newDist - lastTouchDist;
        const zoomFactor = 1 - delta * 0.002;

        this.camera.position.multiplyScalar(zoomFactor);

        const distance = this.camera.position.length();
        if (distance < 20) {
          this.camera.position.normalize().multiplyScalar(20);
        } else if (distance > 200) {
          this.camera.position.normalize().multiplyScalar(200);
        }

        lastTouchDist = newDist;
      }
    });

    this.renderer.domElement.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) {
        lastTouchDist = null;
      }
    });

    document.getElementById("pause-btn").addEventListener("click", () => {
      this.isPaused = !this.isPaused;
      const btn = document.getElementById("pause-btn");
      btn.textContent = this.isPaused ? "Resume" : "Pause";
      btn.classList.toggle("active", this.isPaused);
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      this.resetPlanets();
    });

    document.getElementById("labels-btn").addEventListener("click", () => {
      this.showLabels = !this.showLabels;
      const btn = document.getElementById("labels-btn");
      btn.textContent = this.showLabels ? "Hide Labels" : "Show Labels";
      btn.classList.toggle("active", this.showLabels);

      if (this.showLabels) {
        this.createLabels();
      } else {
        this.removeLabels();
      }
    });

    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    this.renderer.domElement.addEventListener("mousedown", (e) => {
      mouseDown = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
      document.body.classList.add("grabbing");
    });

    this.renderer.domElement.addEventListener("mousemove", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handleMouseHover();

      if (!mouseDown) return;

      const deltaX = e.clientX - mouseX;
      const deltaY = e.clientY - mouseY;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;

      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    this.renderer.domElement.addEventListener("mouseup", () => {
      mouseDown = false;
      document.body.classList.remove("grabbing");
    });

    this.renderer.domElement.addEventListener("mouseleave", () => {
      mouseDown = false;
      document.body.classList.remove("grabbing");
      this.clearPlanetInfo();
    });

    this.renderer.domElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const zoomDirection = e.deltaY > 0 ? 1 : -1;
      this.camera.position.multiplyScalar(1 + zoomDirection * zoomSpeed);

      const distance = this.camera.position.length();
      if (distance < 20) this.camera.position.normalize().multiplyScalar(20);
      else if (distance > 200)
        this.camera.position.normalize().multiplyScalar(200);
    });

    const applyCameraRotation = () => {
      currentRotationX += (targetRotationX - currentRotationX) * 0.1;
      currentRotationY += (targetRotationY - currentRotationY) * 0.1;
      const radius = this.camera.position.length();
      this.camera.position.x =
        radius * Math.sin(currentRotationY) * Math.cos(currentRotationX);
      this.camera.position.y = radius * Math.sin(currentRotationX);
      this.camera.position.z =
        radius * Math.cos(currentRotationY) * Math.cos(currentRotationX);
      this.camera.lookAt(0, 0, 0);
      requestAnimationFrame(applyCameraRotation);
    };
    applyCameraRotation();

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          document.getElementById("pause-btn").click();
          break;
        case "r":
        case "R":
          document.getElementById("reset-btn").click();
          break;
        case "l":
        case "L":
          document.getElementById("labels-btn").click();
          break;
      }
    });
  }

  handleMouseHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.planets.map((p) => p.mesh).concat([this.sun])
    );

    if (intersects.length > 0) {
      const intersected = intersects[0].object;

      if (intersected.userData.type === "planet") {
        if (this.hoveredPlanet !== intersected) {
          this.hoveredPlanet = intersected;
          this.showPlanetInfo(intersected.userData.data);
          this.renderer.domElement.style.cursor = "pointer";
        }
      } else if (intersected.userData.type === "sun") {
        this.showSunInfo();
        this.renderer.domElement.style.cursor = "pointer";
      }
    } else {
      if (this.hoveredPlanet) {
        this.hoveredPlanet = null;
        this.clearPlanetInfo();
        this.renderer.domElement.style.cursor = "grab";
      }
    }
  }

  showPlanetInfo(data) {
    const infoPanel = document.getElementById("planet-info");
    infoPanel.classList.add("active");
    document.getElementById("distance").textContent = data.realDistance;
    document.getElementById("period").textContent = data.period;
    document.getElementById("diameter").textContent = data.diameter;
    document.querySelector("#planet-info h5").textContent = data.name;
  }

  showSunInfo() {
    const infoPanel = document.getElementById("planet-info");
    infoPanel.classList.add("active");
    document.getElementById("distance").textContent = "-";
    document.getElementById("period").textContent = "-";
    document.getElementById("diameter").textContent = "1,392,700 km";
    document.querySelector("#planet-info h5").textContent = "Sun";
  }

  clearPlanetInfo() {
    document.getElementById("distance").textContent = "-";
    document.getElementById("period").textContent = "-";
    document.getElementById("diameter").textContent = "-";
    document.querySelector("#planet-info h5").textContent =
      "Hover over a planet for details";
  }

  resetPlanets() {
    this.planets.forEach((planet, index) => {
      planet.angle = Math.random() * Math.PI * 2;
      planet.currentSpeed = planet.data.speed;
      const slider = document.getElementById(`speed-${index}`);
      const speedValue = slider.nextElementSibling;
      slider.value = planet.data.speed;
      speedValue.textContent = `${planet.data.speed.toFixed(1)}x`;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.isPaused) {
      const deltaTime = this.clock.getDelta();
      this.sun.rotation.y += deltaTime * 0.5;
      this.planets.forEach((planet) => {
        planet.angle += deltaTime * planet.currentSpeed * 0.5;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.data.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.data.distance;
        planet.mesh.rotation.y += deltaTime * 2;
        if (planet.label) {
          planet.label.position.copy(planet.mesh.position);
          planet.label.position.y += planet.data.size + 2;
          planet.label.lookAt(this.camera.position);
        }
      });
    }
    this.renderer.render(this.scene, this.camera);
  }
}

// ✅ Initialize solar system + mobile menu toggle
window.addEventListener("load", () => {
  const solarSystem = new SolarSystem();

  const menuBtn = document.getElementById("mobile-menu-btn");
  const controlsPanel = document.getElementById("controls-panel");
  const planetInfo = document.getElementById("planet-info");
  const closeControls = document.getElementById("close-controls");
  const closeInfo = document.getElementById("close-info");

  menuBtn.addEventListener("click", () => {
    controlsPanel.classList.toggle("active");
  });

  closeControls.addEventListener("click", () => {
    controlsPanel.classList.remove("active");
  });

  closeInfo.addEventListener("click", () => {
    planetInfo.classList.remove("active");
  });
});
