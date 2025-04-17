let project = undefined;
let originalColor = undefined;
let topBar = undefined;

browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(message) {
  if (message.type === 'historyStateUpdated' || message.type === 'set_color') {
    update();
  }
}

function getGcpProject() {
  const query = window.location.search;
  const paramsMap = new URLSearchParams(query);

  return paramsMap.get('project');
}

function colorize(color) {
  if (!topBar) return;

  topBar.style.backgroundColor = color;
}

async function init() {
  topBar = document.querySelector('.cfc-platform-bar-shadow');
  if (!topBar) {
    console.warn('Could not find top bar element to colorize');
    return;
  }

  originalColor = getComputedStyle(topBar).backgroundColor;
}

async function update() {
  project = getGcpProject();

  const result = await browser.storage.local.get('projectColors');
  const projectColors = result.projectColors || {};
  const color = projectColors[project];

  colorize(color || originalColor);
  browser.runtime.sendMessage({
    type: 'set_is_active',
    project,
    isActive: !!color,
  });
}

init();
update();
