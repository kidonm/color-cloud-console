const colorBar = document.getElementById('color-bar');
const expander = document.querySelector('.expander');
const expanderButton = document.getElementById('expander-button');
const projectsTable = document.getElementById('projects-table');
const colorSwatches = document.querySelectorAll('.color-swatch');
const clearButton = document.getElementById('clear-button');
const pickerSwatch = document.getElementById('picker-swatch');
const colorPickerGrid = document.getElementById('color-picker-grid');
const fixedSwatches = document.querySelectorAll('.color-swatch:not(.picker)');

async function getCurrentTab() {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  return tabs[0];
}

async function getCurrentState() {
  const currentTab = await getCurrentTab();
  const response = await browser.runtime.sendMessage({
    type: 'get_state',
    tabId: currentTab.id,
  });
  return { state: { ...response, tab: currentTab } };
}

async function getProjectColors() {
  const result = await browser.storage.local.get('projectColors');
  return result.projectColors || {};
}

function renderInactive() {
  colorBar.style.display = 'none';
  colorBar.style.visibility = 'hidden';
  clearButton.style.display = 'none';
  expander.style.borderTop = 'none';
  expander.style.paddingTop = '0';
  expanderButton.style.display = 'none';
  projectsTable.style.display = 'block';
}

function renderActive() {
  colorBar.style.display = 'flex';
  colorBar.style.visibility = 'visible';
  expander.style.paddingTop = '20px';

  expanderButton.style.display = 'block';
  projectsTable.style.display = 'none';
}

function renderSwatches(active) {
  colorSwatches.forEach((swatch, index) => {
    if (index === active) {
      swatch.classList.add('active');
    } else {
      swatch.classList.remove('active');
    }
  });
}

const shadePalettes = {
  lighter: [
    '#ef9a9a',
    '#ffe082',
    '#90caf9',
    '#a5d6a7',
    '#f8bbd0',
    '#e1bee7',
    '#c5cae9',
    '#b2dfdb',
    '#c5e1a5',
    '#fff9c4',
    '#ffe0b2',
    '#ffccbc',
    '#bcaaa4',
    '#b0bec5',
    '#eeeeee',
    '#b0bec5',
  ],
  default: [
    '#e57373',
    '#ffd54f',
    '#64b5f6',
    '#81c784',
    '#f48fb1',
    '#ce93d8',
    '#9fa8da',
    '#80cbc4',
    '#aed581',
    '#fff176',
    '#ffb74d',
    '#ff8a65',
    '#a1887f',
    '#90a4ae',
    '#e0e0e0',
    '#78909c',
  ],
  darker: [
    '#ef5350',
    '#ffca28',
    '#42a5f5',
    '#66bb6a',
    '#f06292',
    '#ba68c8',
    '#7986cb',
    '#4db6ac',
    '#9ccc65',
    '#ffee58',
    '#ffa726',
    '#ff7043',
    '#8d6e63',
    '#78909c',
    '#bdbdbd',
    '#607d8b',
  ],
};

const shadesContainer = document.querySelector('.color-grid-shades');
let selectedColorIndex = null;

function findColorIndex(color) {
  for (const shade of Object.keys(shadePalettes)) {
    const idx = shadePalettes[shade].indexOf(color);
    if (idx !== -1) return { index: idx, shade };
  }
  return null;
}

function showShadesForIndex(colorIndex, activeShade) {
  selectedColorIndex = colorIndex;
  if (colorIndex === null) {
    shadesContainer.classList.add('disabled');
    document.querySelectorAll('.shade-swatch').forEach((swatch) => {
      swatch.style.backgroundColor = '';
      swatch.classList.remove('active');
    });
    return;
  }
  shadesContainer.classList.remove('disabled');
  document.querySelectorAll('.shade-swatch').forEach((swatch) => {
    const shade = swatch.dataset.shade;
    const color = shadePalettes[shade][colorIndex];
    swatch.dataset.color = color;
    swatch.style.backgroundColor = color;
    swatch.classList.toggle('active', shade === activeShade);
  });
}

function highlightGridSwatch(color) {
  document
    .querySelectorAll('.color-grid-colors .color-grid-swatch')
    .forEach((swatch) => {
      swatch.classList.toggle('active', swatch.dataset.color === color);
    });
}

function activeFromColor(color) {
  let activeSwatch = null;
  colorSwatches.forEach((swatch, index) => {
    if (swatch.dataset.color === color) {
      activeSwatch = index;
    }
  });
  return activeSwatch;
}

Promise.all([getCurrentState(), getProjectColors()]).then(
  ([state, projectColors]) => {
    if (state.state.project) {
      renderActive();

      const tab = state.state.tab;
      const project = state.state.project;
      const currentColor = projectColors[project];

      document.getElementById('project-name').textContent = project;

      // If current color doesn't match a fixed swatch default, set the picker to that color
      const fixedMatch = Array.from(fixedSwatches).some(
        (s) => s.dataset.color === currentColor,
      );
      if (currentColor && !fixedMatch) {
        pickerSwatch.dataset.color = currentColor;
        pickerSwatch.style.background = currentColor;
      }
      // Restore shade state for any custom color in the palette
      if (currentColor) {
        const found = findColorIndex(currentColor);
        if (found) {
          showShadesForIndex(found.index, found.shade);
          highlightGridSwatch(shadePalettes.default[found.index]);
        }
      }

      let activeSwatch = currentColor && activeFromColor(currentColor);
      clearButton.style.display = currentColor ? 'block' : 'none';

      renderSwatches(activeSwatch);

      function selectColor(color) {
        pickerSwatch.dataset.color = color;
        pickerSwatch.style.background = color;
        projectColors[project] = color;
        browser.storage.local.set({ projectColors });
        activeSwatch = activeFromColor(color);
        renderSwatches(activeSwatch);
        updateProjectsTable(projectColors);
        browser.tabs.sendMessage(tab.id, { type: 'set_color' });
        clearButton.style.display = 'block';

        const found = findColorIndex(color);
        if (found) {
          highlightGridSwatch(shadePalettes.default[found.index]);
          showShadesForIndex(found.index, found.shade);
        }
      }

      colorSwatches.forEach((swatch) => {
        swatch.addEventListener('click', function () {
          const color = this.dataset.color;
          if (project && color) {
            selectColor(color);
          }
        });
      });

      // Handle grid color swatch clicks
      document
        .querySelectorAll('.color-grid-colors .color-grid-swatch')
        .forEach((gridSwatch) => {
          gridSwatch.addEventListener('click', function () {
            const color = this.dataset.color;
            if (project) {
              selectColor(color);
            }
          });
        });

      // Handle shade swatch clicks
      document.querySelectorAll('.shade-swatch').forEach((shadeSwatch) => {
        shadeSwatch.addEventListener('click', function () {
          const color = this.dataset.color;
          if (project && selectedColorIndex !== null) {
            selectColor(color);
          }
        });
      });

      // Toggle color grid when picker swatch is clicked
      pickerSwatch.addEventListener('click', function () {
        const isVisible = colorPickerGrid.style.display !== 'none';
        colorPickerGrid.style.display = isVisible ? 'none' : 'flex';
      });

      clearButton.addEventListener('click', () => {
        if (project) {
          // Clear the color for this project
          delete projectColors[project];
          browser.storage.local.set({ projectColors });
          activeSwatch = null;
          renderSwatches(null);
          updateProjectsTable(projectColors);
          browser.tabs.sendMessage(tab.id, { type: 'set_color' });
          colorPickerGrid.style.display = 'none';
          showShadesForIndex(null, null);
          highlightGridSwatch(null);
          pickerSwatch.dataset.color = '';
          pickerSwatch.style.background = '';
          clearButton.style.display = 'none';
        }
      });

      expanderButton.addEventListener('click', () => {
        const isExpanded = projectsTable.style.display !== 'none';
        projectsTable.style.display = isExpanded ? 'none' : 'block';
        expanderButton.classList.toggle('expanded', !isExpanded);
      });
    } else {
      renderInactive();
    }

    updateProjectsTable(projectColors);
  },
);

// Function to update the projects table
function updateProjectsTable(projectColors) {
  const tbody = document.getElementById('projects-body');
  tbody.innerHTML = ''; // Clear existing rows

  Object.entries(projectColors).forEach(([project, color]) => {
    const row = document.createElement('tr');

    const projectCell = document.createElement('td');
    const projectLink = document.createElement('a');
    projectLink.className = 'project-link';
    projectLink.textContent = project;
    projectLink.href = `https://console.cloud.google.com/home/dashboard?project=${project}`;
    projectLink.target = '_blank';
    projectCell.appendChild(projectLink);

    const colorCell = document.createElement('td');
    const colorPreview = document.createElement('span');
    colorPreview.className = 'color-preview';
    colorPreview.style.backgroundColor = color;
    colorCell.appendChild(colorPreview);
    colorCell.appendChild(document.createTextNode(color));

    row.appendChild(projectCell);
    row.appendChild(colorCell);
    tbody.appendChild(row);
  });
}
