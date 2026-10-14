/* Self-contained browser simulation. No device connections, network calls or persistent identifiers. */
(() => {
  const root = document.querySelector('.floorplan-demo');
  if (!root) return;
  const rooms = JSON.parse(document.querySelector('#fp-room-data').textContent).rooms;
  const byId = new Map(rooms.map(room => [room.id, room]));
  const $ = selector => root.querySelector(selector);
  const state = new Map();
  let selected = 'living';
  let activeScene = 'home';
  const scenes = {
    home: { name: '回家', description: '公共空间亮起，客厅窗帘打开', lights: {living:85,dining:65,entry:75,kitchen:55,balcony:30}, curtains:75, ac:['living'], mode:'cool', temperature:26 },
    away: { name: '离家', description: '灯光和空调关闭，窗帘合上', lights:{}, curtains:0, ac:[], mode:'cool', temperature:26 },
    movie: { name: '观影', description: '客厅柔光，窗帘合上', lights:{living:15,entry:10}, curtains:0, ac:['living'], mode:'cool', temperature:26 },
    night: { name: '晚安', description: '卧室柔光，窗帘合上', lights:{master:15,bed1:10,bed2:10,entry:8,guestbath:10}, curtains:0, ac:['master','bed1','bed2'], mode:'cool', temperature:26 }
  };
  const modeNames = {cool:'制冷',heat:'制热',fan:'送风'};
  function labelState(room,s) {
    const items = [s.light ? `灯光 ${s.brightness}%` : '灯光关闭'];
    if(room.curtain) items.push(`窗帘打开 ${s.curtain}%`);
    if(room.ac) items.push(s.ac ? `空调${modeNames[s.mode]}${s.mode==='fan'?'':` ${s.temperature}°C`}` : '空调关闭');
    return items.join(' · ');
  }
  function render() {
    for (const room of rooms) {
      const s = state.get(room.id);
      const polygon = $(`[data-room="${room.id}"]`);
      polygon.setAttribute('aria-pressed', String(room.id === selected));
      polygon.setAttribute('aria-label', `选择${room.name}，${labelState(room,s)}`);
      polygon.dataset.lightOn = String(s.light);
      polygon.dataset.brightness = String(s.light ? s.brightness : 0);
      const glow = $(`[data-light="${room.id}"]`);
      glow.setAttribute('opacity', String(s.light ? .18 + s.brightness / 100 * .43 : 0));
      const mapSwitch = $(`[data-map-switch="${room.id}"]`);
      mapSwitch.setAttribute('aria-pressed', String(s.light));
      mapSwitch.setAttribute('aria-label', `切换${room.name}灯光，当前${s.light?'开启':'关闭'}`);
      mapSwitch.querySelector('.fp-lamp-state').textContent = s.light?'开':'关';
      mapSwitch.querySelector('.fp-lamp-dot').setAttribute('fill', s.light?'#e5a63f':'#b6b0a5');
      if(room.curtain) {
        const curtain = $(`[data-curtain="${room.id}"]`);
        curtain.style.setProperty('--curtain-scale', String(.08 + .92 * (1 - s.curtain / 100)));
        curtain.dataset.open = String(s.curtain);
      }
      if(room.ac) {
        const ac = $(`[data-ac="${room.id}"]`);
        ac.setAttribute('opacity', s.ac?'1':'.35');
        ac.dataset.power = String(s.ac);
        ac.dataset.mode = s.mode;
        ac.dataset.temperature = String(s.temperature);
      }
    }
    const room = byId.get(selected), s = state.get(selected);
    $('#fp-room-select').value = selected;
    $('#fp-selected-room').textContent = room.name;
    $('#fp-room-status').textContent = labelState(room,s);
    const power = $('[data-fp-action="light"]');
    power.setAttribute('aria-pressed', String(s.light)); power.textContent = s.light?'关灯':'开灯';
    $('#fp-brightness').value = s.light?s.brightness:0;
    $('#fp-brightness-value').textContent = s.light?`${s.brightness}%`:'已关闭';
    $('[data-fp-action="switch"]').setAttribute('aria-label', `按一下${room.name}墙面开关，${s.light?'关闭':'开启'}灯光`);
    $('#fp-curtain-control').hidden = !room.curtain;
    $('#fp-no-curtain').hidden = !!room.curtain;
    if(room.curtain) {
      $('#fp-curtain-range').value = s.curtain;
      $('#fp-curtain-value').textContent = `${s.curtain}%`;
      $('#fp-curtain-state').textContent = s.curtain===0?'已合上':s.curtain===100?'已打开':'部分打开';
    }
    $('#fp-ac-control').hidden = !room.ac;
    $('#fp-no-ac').hidden = !!room.ac;
    if(room.ac) {
      const ac = $('[data-fp-action="ac"]');ac.setAttribute('aria-pressed',String(s.ac));ac.textContent=s.ac?'关闭':'开启';
      $('#fp-ac-mode').value=s.mode;
      $('#fp-temperature').textContent = `${s.temperature}°C`;
      $('[data-fp-action="temp-down"]').disabled=s.temperature<=16||s.mode==='fan';
      $('[data-fp-action="temp-up"]').disabled=s.temperature>=30||s.mode==='fan';
      $('#fp-fan-note').hidden=s.mode!=='fan';
    }
    root.querySelectorAll('[data-fp-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.fpScene===activeScene)));
    $('#fp-scene-status').textContent=activeScene?`${scenes[activeScene].name} · ${scenes[activeScene].description}`:'自定义 · 本地模拟';
  }
  function selectRoom(id) { if(!byId.has(id))return; selected=id; render(); }
  function change(update) { update(state.get(selected));activeScene=null;render(); }
  function toggleLight(s) {s.light=!s.light;if(s.light&&s.brightness===0)s.brightness=65;}
  function applyScene(id) {
    const scene=scenes[id];if(!scene)return;
    // Atomic replacement: a rapid sequence of scene clicks always ends in the final chosen scene.
    rooms.forEach(room=>{const brightness=scene.lights[room.id]||0;state.set(room.id,{light:brightness>0,brightness:brightness||65,curtain:scene.curtains,ac:room.ac&&scene.ac.includes(room.id),mode:scene.mode,temperature:scene.temperature});});
    activeScene=id;render();
  }
  rooms.forEach(room=>{const option=document.createElement('option');option.value=room.id;option.textContent=room.name;$('#fp-room-select').append(option);});
  $('#fp-room-select').addEventListener('change',event=>selectRoom(event.target.value));
  const keyboardClick=(element,fn)=>{element.addEventListener('click',fn);element.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();fn();}});};
  root.querySelectorAll('[data-room]').forEach(element=>keyboardClick(element,()=>selectRoom(element.dataset.room)));
  root.querySelectorAll('[data-map-switch]').forEach(element=>keyboardClick(element,()=>{selectRoom(element.dataset.mapSwitch);change(toggleLight);}));
  root.querySelectorAll('[data-fp-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.fpAction;
    change(s=>{
      if(action==='light'||action==='switch')toggleLight(s);
      else if(action==='curtain-open')s.curtain=100;
      else if(action==='curtain-close')s.curtain=0;
      else if(action==='ac')s.ac=!s.ac;
      else if(action==='temp-up')s.temperature=Math.min(30,s.temperature+1);
      else if(action==='temp-down')s.temperature=Math.max(16,s.temperature-1);
    });
  }));
  $('#fp-brightness').addEventListener('input',event=>change(s=>{s.brightness=Number(event.target.value);s.light=s.brightness>0;}));
  $('#fp-curtain-range').addEventListener('input',event=>change(s=>{s.curtain=Number(event.target.value);}));
  $('#fp-ac-mode').addEventListener('change',event=>change(s=>{s.mode=event.target.value;}));
  root.querySelectorAll('[data-fp-scene]').forEach(button=>button.addEventListener('click',()=>applyScene(button.dataset.fpScene)));
  $('#fp-zoom').addEventListener('click',()=>{
    const zoomed=$('#fp-zoom').getAttribute('aria-pressed')!=='true';
    $('#fp-zoom').setAttribute('aria-pressed',String(zoomed));$('#fp-zoom').textContent=zoomed?'还原户型':'放大户型';
    $('#fp-map-viewport').classList.toggle('is-zoomed',zoomed);
    if(!zoomed){$('#fp-map-viewport').scrollLeft=0;$('#fp-map-viewport').scrollTop=0;}
    $('#fp-zoom-hint').textContent=zoomed?'已放大，可在图内左右、上下滑动查看。':'灯光仅显示在对应房间内。';
  });
  const mobileLayout = window.matchMedia('(max-width:700px)');
  const arrangeScenes = () => { const bar=$('.fp-scene-bar'); if(mobileLayout.matches)root.insertBefore(bar,$('.fp-layout'));else $('.fp-controls').prepend(bar); };
  mobileLayout.addEventListener('change',arrangeScenes);arrangeScenes();
  $('.fp-controls').hidden=false;$('.fp-scene-bar').hidden=false;$('#fp-zoom').hidden=false;
  applyScene('home');
})();

