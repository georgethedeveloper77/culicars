module.exports = {
  apps: [
    {
      name: "culicars-api",
      cwd: "/var/www/vhosts/culicars.com/httpdocs/apps/api",
      script: "node",
      // IMPORTANT: use dist only if your build outputs dist/server.js
      // If not, we’ll use ts-node-dev temporarily.
      args: "dist/server.js",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
    {
      name: "culicars-web",
      cwd: "/var/www/vhosts/culicars.com/httpdocs/apps/web",
      script: "node",
      args: "node_modules/next/dist/bin/next start -p 3002",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_BASE: "https://api.culicars.com",
      },
    },
  ],
};
