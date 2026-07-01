// PM2 process manager config — keeps the app running & restarts on crash/reboot.
// Usage on the server:  pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: 'readyscore',
      cwd: './server',      // so server/.env is loaded correctly
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
    },
  ],
};
