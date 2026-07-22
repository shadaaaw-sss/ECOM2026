const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: process.versions,

  // Secure IPC methods
  invoke: (channel, data) => {
    const validChannels = [
      'get-api-url',
      'get-app-version',
      'set-api-url',
      'get-api-url-preference',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  on: (channel, func) => {
    const validChannels = ['api-url-changed'];
    if (validChannels.includes(channel)) {
      const subscription = (_event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    throw new Error(`Unauthorized IPC channel: ${channel}`);
  },

  send: (channel, data) => {
    const validChannels = [];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    }
  },
});