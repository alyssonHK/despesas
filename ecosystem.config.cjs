
module.exports = {
  apps : [{
    name   : "despesas-app", 
    script : "npm",          
    args   : "run start",   

    cwd    : "/home/ubuntu/despesas", 
    interpreter: "node",     


    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 4174 
    },

   
    log_date_format : "YYYY-MM-DD HH:mm:ss",
    error_file      : "logs/pm2-error.log",
    out_file        : "logs/pm2-output.log",
    merge_logs      : true, 

    instances: 1,
    exec_mode: "fork", 
    watch: false,
    max_memory_restart: "300M",
    restart_delay: 1000,
  }]
};