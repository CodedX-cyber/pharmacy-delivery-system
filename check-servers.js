const http = require('http');

async function checkServer(url, name) {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${name}: Running (${res.statusCode})`);
        resolve(true);
      } else {
        console.log(`⚠️  ${name}: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    request.on('error', (err) => {
      console.log(`❌ ${name}: Not running (${err.message})`);
      resolve(false);
    });
    
    request.setTimeout(3000, () => {
      console.log(`❌ ${name}: Timeout`);
      request.destroy();
      resolve(false);
    });
  });
}

async function checkAllServers() {
  console.log('🔍 Checking Server Status...');
  console.log('================================');
  
  const servers = [
    { url: 'http://localhost:3000/health', name: 'Backend API Server' },
    { url: 'http://localhost:3001/', name: 'Admin Panel' },
    { url: 'http://localhost:19006/', name: 'Mobile App (Expo)' }
  ];
  
  let runningCount = 0;
  
  for (const server of servers) {
    const isRunning = await checkServer(server.url, server.name);
    if (isRunning) runningCount++;
  }
  
  console.log('================================');
  console.log(`📊 Status: ${runningCount}/${servers.length} servers running`);
  
  if (runningCount === servers.length) {
    console.log('🎉 All servers are running!');
    console.log('\n📱 Access Information:');
    console.log('  • Backend API: http://localhost:3000');
    console.log('  • Admin Panel: http://localhost:3001');
    console.log('  • Mobile App: http://localhost:19006 (or use Expo Go app)');
    console.log('\n🔑 Demo Credentials:');
    console.log('  • Patient: demo@user.com / password123');
    console.log('  • Admin: admin@pharmacy.com / admin123');
  } else {
    console.log('⚠️  Some servers are not running. Check the logs above.');
  }
}

checkAllServers();
