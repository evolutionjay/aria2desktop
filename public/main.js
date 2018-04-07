const {app, BrowserWindow, Menu, ipcMain, shell, Tray, clipboard} = require('electron');
const child_process = require('child_process');
const path = require('path')
const fs = require('fs')
const url = require('url')

const template = [
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { shell.openExternal('https://github.com/wapznw/aria2desktop') }
      }
    ]
  }
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about', label: '关于' + app.getName()},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  });
}

app.setName('Aria2');
let menu = Menu.buildFromTemplate(template);

let mainWindow;

const aria2dir = path.join(__dirname, './aria2cli');
const aria2Cli = path.resolve(aria2dir, 'aria2c');
const aria2DownloadDir = path.join(process.env.HOME, 'Downloads');
const sessionFile = path.join(process.env.HOME, '.aria2.session');
const aria2ConfFile = path.join(process.env.HOME, '.aria2.conf');
if (!fs.existsSync(sessionFile)) {
  fs.writeFileSync(sessionFile, "")
}
if (!fs.existsSync(aria2ConfFile)){
  fs.writeFileSync(aria2ConfFile, fs.readFileSync(path.resolve(aria2dir, 'aria2.conf')))
}
const aria2Conf = [
  '--dir', aria2DownloadDir,
  '--conf-path', aria2ConfFile,
  '--input-file', sessionFile,
  '--save-session', sessionFile,
  '--max-concurrent-downloads', 10,
  '--max-connection-per-server', 16,
  '--min-split-size', '1024K',
  '--split', 16,
  '--max-overall-download-limit', '0K',
  '--max-overall-upload-limit', '0K',
  '--max-download-limit', '0K',
  '--max-upload-limit', '0K',
  '--continue', 'true',
  '--auto-file-renaming', 'true',
  '--allow-overwrite', 'true',
  '--disk-cache', '0M',
  '--max-tries', 0,
  '--retry-wait', 5,
  '--rpc-secret', 'xxxx'
];

if (fs.existsSync(aria2Cli)){

  const worker = child_process.spawn(aria2Cli, aria2Conf);

  worker.stdout.on('data', function(data){
    console.log(data.toString());
  });

  process.on('exit', function () {
    worker.killed || worker.kill();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({width: 900, height: 600, titleBarStyle: 'hiddenInset', show: false});
  // mainWindow.loadURL('http://localhost:3000/');
  // mainWindow.loadURL(`file://${process.cwd()}/electron.asar/index.html`)
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function () {
    mainWindow = null
  });

  ipcMain.on('close-window', function () {
    mainWindow.close()
  });
  ipcMain.on('set-window-maximize', function () {
    mainWindow.isMaximized() ? mainWindow.unmaximize () : mainWindow.maximize()
  });
  ipcMain.on('set-window-minimize', function () {
    mainWindow.minimize()
  });

  mainWindow.once('ready-to-show', () => {
    Menu.setApplicationMenu(menu)
    mainWindow.show()
  })

}

app.on('ready', function () {
  createWindow()
  const tray = new Tray(path.join(__dirname, 'aria2tray.png'));
  tray.setToolTip('aria2 desktop');
  // tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow === null) {
      createWindow()
    }
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
});

app.on('window-all-closed', function () {
  // if (process.platform !== 'darwin') {
  // app.quit()
  // }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
});
