import * as $ from '//unpkg.com/three@0.123.0/build/three.module.js'
import { OrbitControls } from '//unpkg.com/three@0.123.0/examples/jsm/controls/OrbitControls.js'

const renderer = new $.WebGLRenderer({ antialias: true });
const scene = new $.Scene();
const camera = new $.PerspectiveCamera(75, 2, .1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
window.addEventListener('resize', () => {
    const { clientWidth, clientHeight } = renderer.domElement;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
});
document.body.prepend(renderer.domElement);
window.dispatchEvent(new Event('resize'));
renderer.setAnimationLoop((t) => {
    renderer.render(scene, camera);
    controls.update();
    animate(t);
});

// ----
// Main
// ---- 

$.ShaderChunk.my_map_fragment = `
#ifdef USE_MAP
    float t = t * 0.001;
    vec2 uv = vUv * 100.0 + vec2(-1.0, 0.5); // scale offset old uv
    vec4 A = texture2D(map, uv);           // old texel
    uv.x += sin(uv.y + t) * 0.1;           // offset u based on v t
    uv.y += length(A.rgb) / 1.0 - t;       // offset v based on color t
    vec4 B = texture2D(map, uv);           // new texel
    vec4 texelColor = vec4(B.r * 1.0, B.g * 0.10, A.b * 15.0, A.a);
    texelColor = mapTexelToLinear(texelColor);
    diffuseColor *= texelColor;
#endif
`;
// https://unsplash.com/photos/QSXOERX45BI
const IMGURL = 'https://images.unsplash.com/photo-1582107208835-973713624596?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=562&q=80';
const RATIO = 562 / 1001; 

scene.background = new $.Color('white');
camera.position.set(0, 0, 0.7);

const light0 = new $.DirectionalLight('white', 1);
light0.position.set(0, 0, 1);
scene.add(light0);

const tex = new $.TextureLoader().load(IMGURL);
tex.wrapS = tex.wrapT = $.MirroredRepeatWrapping;
const geom = new $.PlaneBufferGeometry(100, 100 / RATIO);
const mat = new $.ShaderMaterial({
    uniforms: $.UniformsUtils.merge([ // deep clone
        $.ShaderLib.phong.uniforms,
        { t: 0 }
    ]),
    vertexShader: $.ShaderLib.phong.vertexShader,
    fragmentShader: `
    uniform float t;
    ` + $.ShaderLib.phong.fragmentShader.replace(
        '#include <map_fragment>',
        '#include <my_map_fragment>'
    ),
    lights: true,
});
mat.map = mat.uniforms.map.value = tex;
scene.add(new $.Mesh(geom, mat));

//// Anim

function animate(t /*sec*/) {
    mat.uniforms.t.value = t;
}