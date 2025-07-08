(function(){
  var scene, camera, renderer, controls;
  var packGroup, packBox;
  var cubes = [];
  var plane;
  var dragObj = null;
  var offset = new THREE.Vector3();
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var volumeInfo = document.getElementById('volume');

  function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(60,40,60);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('view').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    var light = new THREE.HemisphereLight(0xffffff,0x444444,1);
    light.position.set(0,1,0);
    scene.add(light);

    plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000,1000), new THREE.MeshBasicMaterial({visible:false}));
    plane.rotateX(-Math.PI/2);
    scene.add(plane);

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);

    createPack();
    animate();
  }

  function createPack(){
    var w = parseFloat(document.getElementById('pack-width').value);
    var h = parseFloat(document.getElementById('pack-height').value);
    var d = parseFloat(document.getElementById('pack-depth').value);

    if(packGroup){
      scene.remove(packGroup);
      cubes.forEach(function(c){scene.remove(c.mesh);});
      cubes=[];
    }
    packGroup = new THREE.Group();
    packBox = new THREE.Box3(new THREE.Vector3(-w/2,0,-d/2), new THREE.Vector3(w/2,h,d/2));
    var geom = new THREE.BoxGeometry(w,h,d);
    var mat = new THREE.MeshBasicMaterial({color:0x0088ff, transparent:true, opacity:0.2, wireframe:false});
    var box = new THREE.Mesh(geom,mat);
    box.position.y = h/2;
    packGroup.add(box);
    scene.add(packGroup);
    updateVolume();
  }

  function addCube(){
    var w = parseFloat(document.getElementById('cube-width').value);
    var h = parseFloat(document.getElementById('cube-height').value);
    var d = parseFloat(document.getElementById('cube-depth').value);

    var geom = new THREE.BoxGeometry(w,h,d);
    var mat = new THREE.MeshPhongMaterial({color:Math.random()*0xffffff});
    var mesh = new THREE.Mesh(geom,mat);
    mesh.position.set((Math.random()-0.5)*20,h/2,(Math.random()-0.5)*20);
    scene.add(mesh);
    cubes.push({mesh:mesh,w:w,h:h,d:d,placed:false});
  }

  function updateVolume(){
    var packVol = packBox.getSize(new THREE.Vector3()).x * packBox.getSize(new THREE.Vector3()).y * packBox.getSize(new THREE.Vector3()).z / 1000;
    var used = 0;
    cubes.forEach(function(c){if(c.placed) used += c.w*c.h*c.d/1000;});
    volumeInfo.textContent = 'Used '+used.toFixed(2)+'L / '+packVol.toFixed(2)+'L';
  }

  function onResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function getIntersect(event, objects){
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left)/rect.width)*2-1;
    mouse.y = -((event.clientY - rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(objects, false)[0] || null;
  }

  function onDown(e){
    var res = getIntersect(e, cubes.map(function(c){return c.mesh;}));
    if(res){
      dragObj = res.object;
      controls.enabled = false;
      var planeIntersect = getIntersect(e,[plane]);
      if(planeIntersect) offset.copy(dragObj.position).sub(planeIntersect.point);
    }
  }

  function onMove(e){
    if(!dragObj) return;
    var planeIntersect = getIntersect(e,[plane]);
    if(planeIntersect){
      dragObj.position.copy(planeIntersect.point).add(offset);
    }
  }

  function onUp(e){
    if(!dragObj){
      return;
    }
    controls.enabled = true;
    var cubeData = cubes.find(function(c){return c.mesh===dragObj;});
    if(checkInside(dragObj,cubeData)){
      cubeData.placed = true;
      dragObj.position.y = cubeData.h/2; // snap to ground
    } else {
      cubeData.placed = false;
    }
    dragObj = null;
    updateVolume();
  }

  function checkInside(mesh,data){
    var bbox = new THREE.Box3().setFromObject(mesh);
    if(!packBox.containsBox(bbox)) return false;
    for(var i=0;i<cubes.length;i++){
      var c = cubes[i];
      if(c.mesh!==mesh && c.placed){
        var bb = new THREE.Box3().setFromObject(c.mesh);
        if(bbox.intersectsBox(bb)) return false;
      }
    }
    return true;
  }

  document.getElementById('create-pack').addEventListener('click', createPack);
  document.getElementById('add-cube').addEventListener('click', addCube);

  function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
  }

  init();
})();
