module.exports = {
  apps: [
    {
      name: 'digital-homes-backend',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'digital-homes-ai',
      script: './ai-valuation/app.py',
      interpreter: 'python3',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        FLASK_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        FLASK_ENV: 'production',
        PORT: 5001
      },
      error_file: './logs/ai-error.log',
      out_file: './logs/ai-out.log',
      log_file: './logs/ai-combined.log',
      time: true,
      max_memory_restart: '2G'
    }
  ]
};
