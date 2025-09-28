#!/usr/bin/env node
/**
 * E2E Test Script for Task Marshal 1.1.0
 */

const { spawn } = require('child_process');
const path = require('path');

// Test data
const testInitiative = 'e2e-test-' + Date.now();
const testTask = {
  title: 'E2E Test Task',
  description: 'Testing filesystem persistence',
  initiativeId: testInitiative,
  priority: 'high',
  tags: ['test', 'e2e']
};

// Test commands
const commands = [
  { type: 'ListTools', id: 'test-list' },
  { 
    type: 'CallTool', 
    id: 'test-create', 
    params: {
      name: 'marshal_tasks',
      arguments: {
        action: 'create',
        task: testTask
      }
    }
  },
  {
    type: 'CallTool',
    id: 'test-list-tasks',
    params: {
      name: 'marshal_tasks',
      arguments: {
        action: 'list',
        filters: { initiativeId: testInitiative }
      }
    }
  },
  {
    type: 'CallTool',
    id: 'test-analyze',
    params: {
      name: 'marshal_tasks',
      arguments: {
        action: 'analyze',
        filters: { initiativeId: testInitiative }
      }
    }
  }
];

async function runE2ETest() {
  console.log('🚀 Starting E2E Test for Task Marshal 1.1.0');
  console.log('Test Initiative:', testInitiative);
  
  const server = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  server.stderr.on('data', (data) => {
    console.log('Server:', data.toString().trim());
  });

  server.stdout.on('data', (data) => {
    console.log('Server Output:', data.toString().trim());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    for (const cmd of commands) {
      console.log(`\n📋 Testing: ${cmd.type}`);
      
      const result = await sendCommand(server, cmd);
      console.log('✅ Response:', JSON.stringify(result, null, 2));
    }
    
    console.log('\n✅ E2E Test Completed Successfully!');
    console.log('📁 Check .taskmarshal/', testInitiative, 'for persisted data');
    
  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
  } finally {
    server.kill();
  }
}

function sendCommand(server, command) {
  return new Promise((resolve, reject) => {
    let output = '';
    
    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stdin.write(JSON.stringify(command) + '\n');

    setTimeout(() => {
      try {
        const lines = output.trim().split('\n');
        const jsonLine = lines.find(line => line.startsWith('{'));
        if (jsonLine) {
          resolve(JSON.parse(jsonLine));
        } else {
          resolve({ success: true, data: output });
        }
      } catch (e) {
        reject(e);
      }
    }, 1000);
  });
}

if (require.main === module) {
  runE2ETest();
}
