const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow;
let backend;

app.whenReady().then(() => {
    let backendPath;

    if (process.env.NODE_ENV === 'development') {
        backendPath = path.join(__dirname, 'llama.exe');
    } else {
        backendPath = path.join(process.resourcesPath, 'llama.exe'); 
    }

    console.log(`Starting backend from: ${backendPath}`);

    backend = spawn(backendPath, [], { windowsHide: true });

    backend.stdout.on('data', (data) => console.log(`Backend: ${data}`));
    backend.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));

    backend.on('exit', (code) => {
        console.log(`Backend exited with code ${code}`);
        backend = null;
    });

    const checkServer = (callback) => {
        http.get('http://127.0.0.1:5000', (res) => {
            callback(res.statusCode === 200);
        }).on('error', () => {
            callback(false);
        });
    };

    const waitForServer = () => {
        checkServer((isRunning) => {
            if (isRunning) {
                mainWindow.loadURL('http://127.0.0.1:5000');
            } else {
                setTimeout(waitForServer, 1000);
            }
        });
    };

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        autoHideMenuBar: true, // Hides the File/Edit/etc. menu bar
        frame: true, // Ensures the close (X) button appears
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.maximize();
    mainWindow.show();

    waitForServer();

    mainWindow.on('closed', () => {
        app.quit(); // Ensures the app quits completely
    });
});

app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Ensures the backend process is killed properly
function stopBackend() {
    if (backend) {
        console.log('Stopping backend process...');
        backend.kill('SIGKILL'); // Ensures process termination
        backend = null;
    }
}

app.on('quit', () => {
    stopBackend(); // Force kills backend on quit
});
