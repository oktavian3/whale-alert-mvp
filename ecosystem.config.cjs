module.exports = {
  apps: [
    {
      name: 'whale-api',
      cwd: __dirname,
      script: 'npm',
      args: 'run dev:api',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'whale-web',
      cwd: __dirname,
      script: 'npm',
      args: 'run dev:web',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'whale-bot',
      cwd: __dirname,
      script: 'npm',
      args: 'run bot',
      env: { NODE_ENV: 'production' },
    },
  ],
};
