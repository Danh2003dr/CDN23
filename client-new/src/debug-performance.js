// Debug script for performance data
// Add this to browser console to test

async function debugPerformance() {
  try {
    console.log('🔍 Debugging Performance Data...');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.error('❌ No token found. Please login first.');
      return;
    }
    
    // Test nodes API
    console.log('📊 Testing nodes API...');
    const nodesResponse = await fetch('/api/nodes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const nodesData = await nodesResponse.json();
    console.log('🏗️ Nodes Response:', nodesData);
    
    if (nodesData.success && nodesData.data.nodes.length > 0) {
      const firstNode = nodesData.data.nodes[0];
      console.log(`\n🔍 Testing performance for node ${firstNode.id} (${firstNode.name})...`);
      
      // Test performance API
      const performanceResponse = await fetch(`/api/nodes/${firstNode.id}/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const performanceData = await performanceResponse.json();
      console.log('⚡ Performance Response:', performanceData);
      
      if (performanceData.success) {
        const metrics = performanceData.data.metrics;
        console.log('\n📊 Performance Metrics:');
        console.log(`CPU Usage: ${metrics.cpu_usage}%`);
        console.log(`Memory Usage: ${metrics.memory_usage}%`);
        console.log(`Disk Usage: ${metrics.disk_usage}%`);
        console.log(`Network In: ${metrics.network_in} Mbps`);
        console.log(`Network Out: ${metrics.network_out} Mbps`);
        console.log(`Response Time: ${metrics.response_time} ms`);
        console.log(`Cache Hit Rate: ${metrics.cache_hit_rate}%`);
        console.log(`Connections: ${metrics.connections}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug function
debugPerformance(); 