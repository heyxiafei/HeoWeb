document.documentElement.classList.add('has-js');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
if (menuButton && mobileNav) {
  menuButton.hidden = false;
  const closeMenu = () => { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = '菜单'; };
  menuButton.addEventListener('click', () => { const expanded = menuButton.getAttribute('aria-expanded') !== 'true'; mobileNav.hidden = !expanded; menuButton.setAttribute('aria-expanded', String(expanded)); menuButton.textContent = expanded ? '收起' : '菜单'; });
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });
  const desktop = window.matchMedia('(min-width:701px)');
  desktop.addEventListener('change', e => { if (e.matches) closeMenu(); });
}
const stages = {
  '新房规划': ['把智能，提前放进计划。', '从户型和生活习惯开始，规划设备点位、网络、回路与自动化场景。灯光方案建议在水电阶段介入。'],
  '正在装修': ['先核对现场，再选择设备。', '结合现有回路、零火线、底盒和施工进度，确认开关、灯具、窗帘与网络的安装条件。'],
  '已入住': ['从现有的家，开始改变。', '根据已有线路与设备制定改造方案，先梳理最常用的灯光、窗帘和生活场景，再确认可实现的功能。']
};
document.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => {
  const stage = button.dataset.stage;
  document.querySelectorAll('[data-stage]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#stage-title').textContent = stages[stage][0];
  document.querySelector('#stage-copy').textContent = stages[stage][1];
  const link = document.querySelector('#stage-link');
  link.textContent = `咨询${stage} ↗`;
  link.href = `contact.html?stage=${encodeURIComponent(stage)}`;
}));
const chosen = new URLSearchParams(location.search).get('stage');
const selected = document.querySelector('#selected-stage');
if (selected && Object.hasOwn(stages, chosen)) selected.textContent = `你选择的装修阶段：${chosen}。咨询时可以一起说明。`;
document.querySelectorAll('[data-copy]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    button.disabled = true; button.textContent = '正在复制';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(button.dataset.copy);
      status.textContent = '微信号已复制，可前往微信搜索添加。';
    } catch { status.textContent = '未能自动复制，请长按上方微信号手动复制。'; }
    finally { button.disabled = false; button.textContent = '复制微信号'; }
  });
});
