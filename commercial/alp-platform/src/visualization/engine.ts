import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { VisualizationScene, SceneEntity, Plan3D, ThreeScene } from "../types";

export class VisualizationEngine {
  private scenes: Map<string, ThreeScene> = new Map();

  createScene(config: VisualizationScene): THREE.Scene {
    const scene = new THREE.Scene();

    config.lights?.forEach((light) => {
      let threeLight: THREE.Light;
      switch (light.type) {
        case "ambient":
          threeLight = new THREE.AmbientLight(light.color, light.intensity);
          break;
        case "directional":
          threeLight = new THREE.DirectionalLight(light.color, light.intensity);
          break;
        case "point":
          threeLight = new THREE.PointLight(light.color, light.intensity);
          break;
        case "spot":
          threeLight = new THREE.SpotLight(light.color, light.intensity);
          break;
        default:
          return;
      }
      if (light.position) {
        threeLight.position.set(light.position[0], light.position[1], light.position[2]);
      }
      scene.add(threeLight);
    });

    config.entities.forEach((entity: SceneEntity) => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: entity.type === "agent" ? 0x00ff88 : entity.type === "model" ? 0x0088ff : 0xaaaaaa,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(entity.position[0], entity.position[1], entity.position[2]);
      mesh.name = entity.label;
      if (entity.rotation) {
        mesh.rotation.set(entity.rotation[0], entity.rotation[1], entity.rotation[2]);
      }
      if (entity.scale) {
        mesh.scale.set(entity.scale[0], entity.scale[1], entity.scale[2]);
      }
      scene.add(mesh);
    });

    return scene;
  }

  addPlan(scene: THREE.Scene, plan: Plan3D): void {
    const spacing = 2;
    plan.entities.forEach((entity: SceneEntity, index: number) => {
      let x = 0, y = 0, z = 0;
      switch (plan.layout) {
        case "grid":
          x = (index % 10) * spacing;
          z = Math.floor(index / 10) * spacing;
          break;
        case "circular":
          const angle = (index / plan.entities.length) * Math.PI * 2;
          const radius = plan.bounds.width / 2;
          x = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
          break;
        case "force":
        case "freeform":
        default:
          x = entity.position[0];
          y = entity.position[1];
          z = entity.position[2];
          break;
      }
      entity.position = [x, y, z] as [number, number, number];

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: entity.type === "agent" ? 0x00ff88 : entity.type === "model" ? 0x0088ff : 0xaaaaaa,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.name = entity.label;
      scene.add(mesh);
    });
  }

  createCamera(config?: VisualizationScene["camera"]): THREE.Camera {
    const camera = config
      ? new THREE.PerspectiveCamera(config.fov ?? 75, 1, 0.1, 1000)
      : new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    if (config) {
      camera.position.set(config.position[0], config.position[1], config.position[2]);
    } else {
      camera.position.set(0, 10, 20);
    }
    return camera;
  }

  createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    return renderer;
  }

  createControls(camera: THREE.Camera, domElement: HTMLElement): OrbitControls {
    const controls = new OrbitControls(camera as THREE.PerspectiveCamera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    return controls;
  }

  animate(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer): void {
    const animateFrame = () => {
      requestAnimationFrame(animateFrame);
      renderer.render(scene, camera);
    };
    animateFrame();
  }

  createSceneBundle(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
  ): ThreeScene {
    const sceneId = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bundle: ThreeScene = {
      id: sceneId,
      name: sceneId,
      scene,
      camera,
      renderer,
      controls: null,
    };
    this.scenes.set(sceneId, bundle);
    return bundle;
  }

  getScene(sceneId: string): ThreeScene | undefined {
    return this.scenes.get(sceneId);
  }

  disposeScene(sceneId: string): boolean {
    const bundle = this.scenes.get(sceneId);
    if (!bundle) return false;

    if (bundle.renderer) {
      const renderer = bundle.renderer as THREE.WebGLRenderer;
      if (typeof renderer.dispose === "function") {
        renderer.dispose();
      }
    }
    this.scenes.delete(sceneId);
    return true;
  }
}
