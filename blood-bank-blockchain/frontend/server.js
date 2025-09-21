const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Blockchain configuration
const HARDHAT_NETWORK_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default Hardhat address
const CONTRACT_ABI = [
  // Essential ABI methods for the frontend
  "function registerDonor(string memory name, uint256 age, uint8 bloodType, string memory contactInfo) external returns (uint256)",
  "function collectBloodUnit(uint256 donorId, string memory additionalInfo) external returns (uint256)",
  "function updateTestResults(uint256 bloodUnitId, string memory testResults, bool approved) external",
  "function registerHospital(string memory name, string memory location, string memory contactInfo, address adminAddress) external returns (uint256)",
  "function createBloodRequest(uint8 bloodType, uint256 unitsRequested, uint256 urgencyLevel, string memory reason) external returns (uint256)",
  "function transferBloodUnit(uint256 bloodUnitId, uint256 toHospitalId, string memory reason) external",
  "function markBloodUnitUsed(uint256 bloodUnitId) external",
  "function getBloodUnitDetails(uint256 bloodUnitId) external view returns (uint256, uint256, uint8, uint256, uint256, uint8, string memory, uint256, string memory)",
  "function getBloodUnitTransferHistory(uint256 bloodUnitId) external view returns (tuple(uint256, uint256, uint256, uint256, string, address)[])",
  "function getAvailableBloodUnits(uint8 bloodType) external view returns (uint256[])",
  "function getSystemStats() external view returns (uint256, uint256, uint256, uint256, uint256)",
  "function donors(uint256) external view returns (uint256, string memory, uint256, uint8, string memory, bool, uint256)",
  "function hospitals(uint256) external view returns (uint256, string memory, string memory, string memory, address, bool, uint256)",
  "function bloodRequests(uint256) external view returns (uint256, uint256, uint8, uint256, uint256, uint8, uint256, string memory)",
  "function grantRole(bytes32 role, address account) external",
  "function MEDICAL_STAFF() external view returns (bytes32)",
  "function HOSPITAL_ADMIN() external view returns (bytes32)",
  "function BLOOD_BANK_ADMIN() external view returns (bytes32)"
];

// Initialize provider and contract
let provider, contract, signer;

async function initializeBlockchain() {
  try {
    provider = new ethers.providers.JsonRpcProvider(HARDHAT_NETWORK_URL);
    signer = provider.getSigner(0); // Use first account
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    console.log('✅ Blockchain connection initialized');
  } catch (error) {
    console.error('❌ Failed to initialize blockchain:', error.message);
  }
}

// Helper functions
const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
const BLOOD_STATUS = ["COLLECTED", "TESTED", "APPROVED", "EXPIRED", "USED", "DISCARDED"];
const REQUEST_STATUS = ["PENDING", "APPROVED", "FULFILLED", "CANCELLED"];

function getBloodTypeName(index) {
  return BLOOD_TYPES[index] || "Unknown";
}

function getStatusName(index) {
  return BLOOD_STATUS[index] || "Unknown";
}

function getRequestStatusName(index) {
  return REQUEST_STATUS[index] || "Unknown";
}

// API Routes

// Get system statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await contract.getSystemStats();
    res.json({
      totalDonors: stats.totalDonors.toString(),
      totalBloodUnits: stats.totalBloodUnits.toString(),
      totalHospitals: stats.totalHospitals.toString(),
      totalRequests: stats.totalRequests.toString(),
      totalTransfers: stats.totalTransfers.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new donor
app.post('/api/donors', async (req, res) => {
  try {
    const { name, age, bloodType, contactInfo } = req.body;
    const tx = await contract.registerDonor(name, age, bloodType, contactInfo);
    const receipt = await tx.wait();
    
    // Extract donor ID from events
    const event = receipt.events?.find(e => e.event === 'DonorRegistered');
    const donorId = event?.args?.donorId?.toString();
    
    res.json({ 
      success: true, 
      donorId,
      transactionHash: receipt.transactionHash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get donor information
app.get('/api/donors/:id', async (req, res) => {
  try {
    const donorId = req.params.id;
    const donor = await contract.donors(donorId);
    
    res.json({
      id: donor.id.toString(),
      name: donor.name,
      age: donor.age.toString(),
      bloodType: getBloodTypeName(donor.bloodType),
      contactInfo: donor.contactInfo,
      isActive: donor.isActive,
      registeredAt: new Date(donor.registeredAt.toNumber() * 1000).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Collect blood unit
app.post('/api/blood-units', async (req, res) => {
  try {
    const { donorId, additionalInfo } = req.body;
    const tx = await contract.collectBloodUnit(donorId, additionalInfo);
    const receipt = await tx.wait();
    
    const event = receipt.events?.find(e => e.event === 'BloodUnitCollected');
    const bloodUnitId = event?.args?.bloodUnitId?.toString();
    
    res.json({ 
      success: true, 
      bloodUnitId,
      transactionHash: receipt.transactionHash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood unit details
app.get('/api/blood-units/:id', async (req, res) => {
  try {
    const bloodUnitId = req.params.id;
    const unit = await contract.getBloodUnitDetails(bloodUnitId);
    
    res.json({
      id: unit[0].toString(),
      donorId: unit[1].toString(),
      bloodType: getBloodTypeName(unit[2]),
      collectionDate: new Date(unit[3].toNumber() * 1000).toISOString(),
      expirationDate: new Date(unit[4].toNumber() * 1000).toISOString(),
      status: getStatusName(unit[5]),
      testResults: unit[6],
      currentHospitalId: unit[7].toString(),
      additionalInfo: unit[8]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update test results
app.put('/api/blood-units/:id/test-results', async (req, res) => {
  try {
    const bloodUnitId = req.params.id;
    const { testResults, approved } = req.body;
    
    const tx = await contract.updateTestResults(bloodUnitId, testResults, approved);
    const receipt = await tx.wait();
    
    res.json({ 
      success: true, 
      transactionHash: receipt.transactionHash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available blood units by type
app.get('/api/blood-units/available/:bloodType', async (req, res) => {
  try {
    const bloodTypeIndex = BLOOD_TYPES.indexOf(req.params.bloodType);
    if (bloodTypeIndex === -1) {
      return res.status(400).json({ error: 'Invalid blood type' });
    }
    
    const availableUnits = await contract.getAvailableBloodUnits(bloodTypeIndex);
    const unitIds = availableUnits.map(id => id.toString());
    
    res.json({ availableUnits: unitIds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register hospital
app.post('/api/hospitals', async (req, res) => {
  try {
    const { name, location, contactInfo, adminAddress } = req.body;
    const tx = await contract.registerHospital(name, location, contactInfo, adminAddress);
    const receipt = await tx.wait();
    
    const event = receipt.events?.find(e => e.event === 'HospitalRegistered');
    const hospitalId = event?.args?.hospitalId?.toString();
    
    res.json({ 
      success: true, 
      hospitalId,
      transactionHash: receipt.transactionHash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hospital information
app.get('/api/hospitals/:id', async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const hospital = await contract.hospitals(hospitalId);
    
    res.json({
      id: hospital.id.toString(),
      name: hospital.name,
      location: hospital.location,
      contactInfo: hospital.contactInfo,
      adminAddress: hospital.adminAddress,
      isActive: hospital.isActive,
      registeredAt: new Date(hospital.registeredAt.toNumber() * 1000).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blood request
app.post('/api/blood-requests', async (req, res) => {
  try {
    const { bloodType, unitsRequested, urgencyLevel, reason } = req.body;
    const bloodTypeIndex = BLOOD_TYPES.indexOf(bloodType);
    
    if (bloodTypeIndex === -1) {
      return res.status(400).json({ error: 'Invalid blood type' });
    }
    
    const tx = await contract.createBloodRequest(bloodTypeIndex, unitsRequested, urgencyLevel, reason);
    const receipt = await tx.wait();
    
    const event = receipt.events?.find(e => e.event === 'BloodRequestCreated');
    const requestId = event?.args?.requestId?.toString();
    
    res.json({ 
      success: true, 
      requestId,
      transactionHash: receipt.transactionHash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer blood unit
app.post('/api/blood-units/:id/transfer', async (req, res) => {
  try {
    const bloodUnitId = req.params.id;
    const { toHospitalId, reason } = req.body;
    
    const tx = await contract.transferBloodUnit(bloodUnitId, toHospitalId, reason);
    const receipt = await tx.wait();
    
    res.json({ 
      success: true, 
      transactionHash: receipt.transactionHash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blood unit transfer history
app.get('/api/blood-units/:id/history', async (req, res) => {
  try {
    const bloodUnitId = req.params.id;
    const history = await contract.getBloodUnitTransferHistory(bloodUnitId);
    
    const transfers = history.map(transfer => ({
      bloodUnitId: transfer.bloodUnitId.toString(),
      fromHospitalId: transfer.fromHospitalId.toString(),
      toHospitalId: transfer.toHospitalId.toString(),
      transferredAt: new Date(transfer.transferredAt.toNumber() * 1000).toISOString(),
      reason: transfer.reason,
      authorizedBy: transfer.authorizedBy
    }));
    
    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
async function startServer() {
  await initializeBlockchain();
  
  app.listen(PORT, () => {
    console.log(`🩸 Blood Bank Management Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
  });
}

startServer().catch(console.error);