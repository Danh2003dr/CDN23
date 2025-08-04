// Cấu hình thu thập dữ liệu thật từ các nguồn khác nhau
module.exports = {
    // Cấu hình cho các CDN nodes thật
    nodes: [
        {
            nodeId: 1,
            name: 'Edge Node - Hanoi (Real)',
            dataSource: 'prometheus',
            config: {
                url: 'http://prometheus-hanoi:9090',
                // Hoặc sử dụng local Prometheus
                // url: 'http://localhost:9090'
            }
        },
        {
            nodeId: 2,
            name: 'Edge Node - HCM (Real)',
            dataSource: 'snmp',
            config: {
                host: '192.168.1.100',
                community: 'public'
            }
        },
        {
            nodeId: 3,
            name: 'Origin Server (Real)',
            dataSource: 'http_api',
            config: {
                apiUrl: 'http://origin-server:8080',
                apiKey: 'your-api-key-here',
                endpoints: {
                    cpu_usage: '/api/metrics/cpu',
                    memory_usage: '/api/metrics/memory',
                    disk_usage: '/api/metrics/disk',
                    network_in_mbps: '/api/metrics/network/in',
                    network_out_mbps: '/api/metrics/network/out',
                    response_time_ms: '/api/metrics/response-time',
                    error_rate: '/api/metrics/error-rate',
                    active_connections: '/api/metrics/connections',
                    cache_hit_rate: '/api/metrics/cache-hit-rate'
                }
            }
        },
        {
            nodeId: 4,
            name: 'Cloudflare CDN (Real)',
            dataSource: 'cloudflare',
            config: {
                zoneId: 'your-zone-id',
                apiToken: 'your-cloudflare-api-token'
            }
        },
        {
            nodeId: 5,
            name: 'AWS EC2 Instance (Real)',
            dataSource: 'cloudwatch',
            config: {
                region: 'ap-southeast-1',
                instanceId: 'i-1234567890abcdef0',
                accessKeyId: 'your-aws-access-key',
                secretAccessKey: 'your-aws-secret-key'
            }
        },
        {
            nodeId: 6,
            name: 'Local System (Real)',
            dataSource: 'local',
            config: {}
        }
    ],

    // Cấu hình cho các CDN providers thật
    cdnProviders: {
        cloudflare: {
            enabled: true,
            zones: [
                {
                    zoneId: 'your-zone-id-1',
                    name: 'Main Website',
                    apiToken: 'your-api-token-1'
                },
                {
                    zoneId: 'your-zone-id-2', 
                    name: 'API Services',
                    apiToken: 'your-api-token-2'
                }
            ]
        },
        aws: {
            enabled: true,
            regions: ['ap-southeast-1', 'us-east-1'],
            instances: [
                {
                    instanceId: 'i-1234567890abcdef0',
                    name: 'CDN Edge Server 1',
                    region: 'ap-southeast-1'
                },
                {
                    instanceId: 'i-0987654321fedcba0',
                    name: 'CDN Edge Server 2', 
                    region: 'us-east-1'
                }
            ]
        },
        azure: {
            enabled: false,
            subscriptionId: 'your-subscription-id',
            resourceGroups: ['cdn-rg'],
            virtualMachines: [
                {
                    vmName: 'cdn-vm-1',
                    resourceGroup: 'cdn-rg'
                }
            ]
        },
        googleCloud: {
            enabled: false,
            projectId: 'your-project-id',
            instances: [
                {
                    instanceName: 'cdn-instance-1',
                    zone: 'asia-southeast1-a'
                }
            ]
        }
    },

    // Cấu hình monitoring tools
    monitoringTools: {
        prometheus: {
            enabled: true,
            servers: [
                {
                    name: 'Prometheus Hanoi',
                    url: 'http://prometheus-hanoi:9090',
                    location: 'Hanoi'
                },
                {
                    name: 'Prometheus HCM',
                    url: 'http://prometheus-hcm:9090',
                    location: 'Ho Chi Minh City'
                }
            ]
        },
        grafana: {
            enabled: true,
            url: 'http://grafana:3000',
            apiKey: 'your-grafana-api-key'
        },
        snmp: {
            enabled: true,
            community: 'public',
            version: '2c',
            timeout: 5000,
            retries: 3
        },
        zabbix: {
            enabled: false,
            url: 'http://zabbix-server/api_jsonrpc.php',
            username: 'admin',
            password: 'your-password'
        }
    },

    // Cấu hình collection intervals
    collection: {
        interval: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
        batchSize: 10
    },

    // Cấu hình alerts và thresholds
    alerts: {
        cpu_threshold: 80, // 80%
        memory_threshold: 85, // 85%
        disk_threshold: 90, // 90%
        response_time_threshold: 100, // 100ms
        error_rate_threshold: 5, // 5%
        cache_hit_rate_threshold: 70 // 70%
    },

    // Cấu hình logging
    logging: {
        level: 'info', // debug, info, warn, error
        file: './logs/real-data-collection.log',
        maxSize: '10m',
        maxFiles: 5
    }
}; 