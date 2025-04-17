browser.webNavigation.onHistoryStateUpdated.addListener(
  handleHistoryStateUpdated,
);
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onRemoved.addListener(handleTabRemoved);

async function readState() {
  const maybeState = await browser.storage.session.get('state');
  return maybeState.state || {};
}

async function setState(state) {
  await browser.storage.session.set({ state });
}

async function addEntry(tabId, payload) {
  const state = await readState();
  await setState({ ...state, [tabId]: payload });
}

async function removeEntry(tabId) {
  const state = await readState();
  if (tabId in state) {
    delete state[tabId];
    await setState(state);
  }
}

async function updateIcon(tabId, isActive) {
  try {
    const iconPath = isActive ? '/icons/icon-colored.svg' : '/icons/icon.svg';
    await browser.action.setIcon({
      path: {
        16: iconPath,
        32: iconPath,
        64: iconPath,
        128: iconPath,
      },
      tabId: tabId,
    });
  } catch (error) {
    console.warn('Failed to update icon:', error);
  }
}

// NOTE: Cannot be async: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_sendresponse
function handleMessage(message, sender, sendResponse) {
  switch (message.type) {
    case 'set_is_active':
      addEntry(sender.tab.id, { project: message.project });
      updateIcon(sender.tab.id, message.isActive);
      break;

    case 'get_state':
      readState().then((state) => {
        sendResponse(state[message.tabId]);
      });
      return true;
  }
}

function handleHistoryStateUpdated(details) {
  browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    const tab = tabs[0];

    if (tab.id === details.tabId) {
      browser.tabs.sendMessage(tab.id, {
        type: 'historyStateUpdated',
        url: details.url,
      });
    }
  });
}

async function handleTabRemoved(tabId) {
  removeEntry(tabId);
}
