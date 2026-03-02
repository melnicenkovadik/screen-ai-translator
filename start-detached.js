const { spawn } = require("child_process");

const electronBinary = require("electron");

const child = spawn(electronBinary, ["."], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
    env: process.env
});

child.unref();
