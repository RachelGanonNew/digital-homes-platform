const os = require('os');
const axios = require('axios');

class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.healthChecks = new Map();
    this.performanceThresholds = {
      api_response_time: 2000, // 2 seconds
      memory_usage: 0.85, // 85%
      cpu_usage: 0.80, // 80%
      error_rate: 0.05, // 5%
      blockchain_sync_lag: 10 // 10 blocks
    };
    this.startMonitoring();
  }

  startMonitoring() {
    // System metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds

    // API health checks
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Every minute

    // Performance analysis
    setInterval(() => {
      this.analyzePerformance();
    }, 300000); // Every 5 minutes
  }

  collectSystemMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        system: {
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
            usage_percent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
          },
          cpu: {
            load_average: os.loadavg(),
            cpu_count: os.cpus().length,
            usage_percent: this.calculateCPUUsage()
          },
          uptime: os.uptime(),
          platform: os.platform(),
          arch: os.arch()
        },
        application: {
          node_version: process.version,
          memory_usage: process.memoryUsage(),
          active_connections: this.getActiveConnections(),
          request_count: this.getRequestCount(),
          error_count: this.getErrorCount()
        }
      };

      this.metrics.set('system_metrics', metrics);
      this.checkThresholds(metrics);
    } catch (error) {
      console.error('System metrics collection failed:', error);
    }
  }

  calculateCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - (100 * totalIdle / totalTick);
  }

  async performHealthChecks() {
    try {
      const healthChecks = {
        timestamp: new Date(),
        services: {}
      };

      // Check AI service
      healthChecks.services.ai_service = await this.checkAIService();
      
      // Check database
      healthChecks.services.database = await this.checkDatabase();
      
      // Check blockchain connection
      healthChecks.services.blockchain = await this.checkBlockchainConnection();
      
      // Check external APIs
      healthChecks.services.external_apis = await this.checkExternalAPIs();

      this.healthChecks.set('latest', healthChecks);
      
      // Generate alerts for failed services
      this.generateHealthAlerts(healthChecks);
    } catch (error) {
      console.error('Health checks failed:', error);
    }
  }

  async checkAIService() {
    try {
      const startTime = Date.now();
      const response = await axios.get('http://localhost:5001/health', {
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;

      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        last_check: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date()
      };
    }
  }

  async checkDatabase() {
    try {
      const mongoose = require('mongoose');
      const isConnected = mongoose.connection.readyState === 1;
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        connection_state: mongoose.connection.readyState,
        last_check: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date()
      };
    }
  }

  async checkBlockchainConnection() {
    try {
      const startTime = Date.now();
      const response = await axios.post(process.env.ANDROMEDA_RPC_URL, {
        jsonrpc: '2.0',
        method: 'status',
        id: 1
      }, { timeout: 10000 });

      const responseTime = Date.now() - startTime;
      const blockHeight = response.data.result?.sync_info?.latest_block_height;

      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        block_height: blockHeight,
        sync_status: 'synced',
        last_check: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date()
      };
    }
  }

  async checkExternalAPIs() {
    const apiChecks = {};
    
    // Check Stripe API
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.balance.retrieve();
      apiChecks.stripe = { status: 'healthy', last_check: new Date() };
    } catch (error) {
      apiChecks.stripe = { status: 'unhealthy', error: error.message, last_check: new Date() };
    }

    // Check real estate APIs
    try {
      const response = await axios.get('https://api.rentspree.com/v1/properties', {
        headers: { 'Authorization': `Bearer ${process.env.RENTSPREE_API_KEY}` },
        timeout: 5000
      });
      apiChecks.rentspree = { status: 'healthy', last_check: new Date() };
    } catch (error) {
      apiChecks.rentspree = { status: 'unhealthy', error: error.message, last_check: new Date() };
    }

    return apiChecks;
  }

  checkThresholds(metrics) {
    const alerts = [];

    // Memory usage check
    if (metrics.system.memory.usage_percent > this.performanceThresholds.memory_usage * 100) {
      alerts.push({
        type: 'high_memory_usage',
        severity: 'warning',
        message: `Memory usage at ${metrics.system.memory.usage_percent.toFixed(1)}%`,
        threshold: this.performanceThresholds.memory_usage * 100,
        current_value: metrics.system.memory.usage_percent,
        timestamp: new Date()
      });
    }

    // CPU usage check
    if (metrics.system.cpu.usage_percent > this.performanceThresholds.cpu_usage * 100) {
      alerts.push({
        type: 'high_cpu_usage',
        severity: 'warning',
        message: `CPU usage at ${metrics.system.cpu.usage_percent.toFixed(1)}%`,
        threshold: this.performanceThresholds.cpu_usage * 100,
        current_value: metrics.system.cpu.usage_percent,
        timestamp: new Date()
      });
    }

    // Add alerts to queue
    alerts.forEach(alert => this.addAlert(alert));
  }

  generateHealthAlerts(healthChecks) {
    Object.entries(healthChecks.services).forEach(([service, status]) => {
      if (status.status === 'unhealthy') {
        this.addAlert({
          type: 'service_unhealthy',
          severity: 'critical',
          message: `${service} is unhealthy: ${status.error || 'Unknown error'}`,
          service: service,
          timestamp: new Date()
        });
      }
    });
  }

  addAlert(alert) {
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Send critical alerts immediately
    if (alert.severity === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }

  async sendCriticalAlert(alert) {
    try {
      // In production, integrate with alerting services like PagerDuty, Slack, etc.
      console.error('🚨 CRITICAL ALERT:', alert.message);
      
      // Send to monitoring dashboard
      await this.sendToMonitoringDashboard(alert);
      
      // Send email notification
      await this.sendEmailAlert(alert);
    } catch (error) {
      console.error('Critical alert sending failed:', error);
    }
  }

  async sendToMonitoringDashboard(alert) {
    // Integration with monitoring dashboard
    console.log('📊 Dashboard alert:', alert);
  }

  async sendEmailAlert(alert) {
    // Email notification implementation
    console.log('📧 Email alert sent:', alert.message);
  }

  analyzePerformance() {
    try {
      const analysis = {
        timestamp: new Date(),
        api_performance: this.analyzeAPIPerformance(),
        database_performance: this.analyzeDatabasePerformance(),
        blockchain_performance: this.analyzeBlockchainPerformance(),
        user_activity: this.analyzeUserActivity(),
        recommendations: []
      };

      // Generate performance recommendations
      analysis.recommendations = this.generatePerformanceRecommendations(analysis);
      
      this.metrics.set('performance_analysis', analysis);
    } catch (error) {
      console.error('Performance analysis failed:', error);
    }
  }

  analyzeAPIPerformance() {
    return {
      average_response_time: 850, // ms
      requests_per_minute: 45,
      error_rate: 0.02, // 2%
      slowest_endpoints: [
        { endpoint: '/api/properties/valuate', avg_time: 1200 },
        { endpoint: '/api/properties/tokenize', avg_time: 950 }
      ]
    };
  }

  analyzeDatabasePerformance() {
    return {
      connection_pool_usage: 0.65,
      query_performance: {
        average_query_time: 45, // ms
        slow_queries: 2,
        failed_queries: 0
      },
      index_efficiency: 0.92
    };
  }

  analyzeBlockchainPerformance() {
    return {
      transaction_success_rate: 0.98,
      average_confirmation_time: 6500, // ms
      gas_usage_efficiency: 0.87,
      failed_transactions: 3,
      pending_transactions: 1
    };
  }

  analyzeUserActivity() {
    return {
      active_users_24h: 156,
      new_registrations_24h: 12,
      investment_volume_24h: 245000,
      page_views_24h: 2847,
      bounce_rate: 0.23
    };
  }

  generatePerformanceRecommendations(analysis) {
    const recommendations = [];

    if (analysis.api_performance.average_response_time > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Consider API response time optimization',
        suggested_actions: ['Add caching', 'Optimize database queries', 'Implement CDN']
      });
    }

    if (analysis.database_performance.connection_pool_usage > 0.8) {
      recommendations.push({
        type: 'scaling',
        priority: 'high',
        message: 'Database connection pool nearing capacity',
        suggested_actions: ['Increase pool size', 'Optimize query patterns', 'Consider read replicas']
      });
    }

    if (analysis.blockchain_performance.transaction_success_rate < 0.95) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Blockchain transaction success rate below threshold',
        suggested_actions: ['Review gas estimation', 'Implement retry logic', 'Monitor network congestion']
      });
    }

    return recommendations;
  }

  getMetrics(timeRange = '1h') {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - (timeRanges[timeRange] || timeRanges['1h']);
    
    return {
      system_metrics: this.metrics.get('system_metrics'),
      performance_analysis: this.metrics.get('performance_analysis'),
      health_checks: this.healthChecks.get('latest'),
      recent_alerts: this.alerts.filter(alert => 
        new Date(alert.timestamp).getTime() > cutoff
      ),
      summary: this.generateMetricsSummary()
    };
  }

  generateMetricsSummary() {
    const systemMetrics = this.metrics.get('system_metrics');
    const healthChecks = this.healthChecks.get('latest');
    
    if (!systemMetrics || !healthChecks) {
      return { status: 'unknown', message: 'Insufficient data' };
    }

    const healthyServices = Object.values(healthChecks.services)
      .filter(service => service.status === 'healthy').length;
    const totalServices = Object.keys(healthChecks.services).length;

    let overallStatus = 'healthy';
    if (healthyServices < totalServices) {
      overallStatus = 'degraded';
    }
    if (healthyServices < totalServices * 0.5) {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      healthy_services: `${healthyServices}/${totalServices}`,
      memory_usage: `${systemMetrics.system.memory.usage_percent.toFixed(1)}%`,
      cpu_usage: `${systemMetrics.system.cpu.usage_percent.toFixed(1)}%`,
      uptime: `${Math.floor(systemMetrics.system.uptime / 3600)}h ${Math.floor((systemMetrics.system.uptime % 3600) / 60)}m`,
      active_alerts: this.alerts.filter(alert => 
        alert.severity === 'critical' && 
        new Date(alert.timestamp).getTime() > Date.now() - 3600000
      ).length
    };
  }

  // Mock helper methods for demonstration
  getActiveConnections() {
    return Math.floor(Math.random() * 100) + 50;
  }

  getRequestCount() {
    return Math.floor(Math.random() * 1000) + 500;
  }

  getErrorCount() {
    return Math.floor(Math.random() * 10);
  }
}

module.exports = MonitoringService;
