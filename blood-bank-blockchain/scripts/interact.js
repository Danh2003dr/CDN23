const hre = require("hardhat");

// Địa chỉ contract sau khi deploy (sẽ được cập nhật)
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Hardhat local default

async function main() {
  console.log("🩸 Interacting with Blood Bank Management System...");
  
  const [owner, hospital1, hospital2, medicalStaff] = await hre.ethers.getSigners();
  
  // Get contract instance
  const BloodBankManagement = await hre.ethers.getContractFactory("BloodBankManagement");
  const bloodBank = BloodBankManagement.attach(CONTRACT_ADDRESS);
  
  console.log("Connected to contract at:", CONTRACT_ADDRESS);
  
  try {
    // Demo: Hiển thị thông tin hệ thống
    console.log("\n📊 Current System Stats:");
    const stats = await bloodBank.getSystemStats();
    console.log(`- Total Donors: ${stats.totalDonors}`);
    console.log(`- Total Blood Units: ${stats.totalBloodUnits}`);
    console.log(`- Total Hospitals: ${stats.totalHospitals}`);
    
    // Demo: Lấy thông tin đơn vị máu
    if (stats.totalBloodUnits > 0) {
      console.log("\n🩸 Blood Unit Details:");
      for (let i = 1; i <= Math.min(3, stats.totalBloodUnits); i++) {
        const unit = await bloodBank.getBloodUnitDetails(i);
        console.log(`\n--- Blood Unit #${i} ---`);
        console.log(`Donor ID: ${unit.donorId}`);
        console.log(`Blood Type: ${getBloodTypeName(unit.bloodType)}`);
        console.log(`Collection Date: ${new Date(unit.collectionDate * 1000).toLocaleDateString()}`);
        console.log(`Expiration Date: ${new Date(unit.expirationDate * 1000).toLocaleDateString()}`);
        console.log(`Status: ${getStatusName(unit.status)}`);
        console.log(`Test Results: ${unit.testResults}`);
        console.log(`Current Hospital ID: ${unit.currentHospitalId}`);
        console.log(`Additional Info: ${unit.additionalInfo}`);
      }
    }
    
    // Demo: Hiển thị đơn vị máu có sẵn theo loại
    console.log("\n🔍 Available Blood Units by Type:");
    for (let bloodType = 0; bloodType < 8; bloodType++) {
      const available = await bloodBank.getAvailableBloodUnits(bloodType);
      if (available.length > 0) {
        console.log(`${getBloodTypeName(bloodType)}: ${available.length} units available`);
      }
    }
    
    // Demo: Tạo yêu cầu máu từ bệnh viện
    console.log("\n🏥 Creating blood request...");
    try {
      const requestTx = await bloodBank.createBloodRequest(
        0, // O_NEG
        2, // 2 units
        4, // High urgency
        "Emergency surgery patient needs O- blood"
      );
      await requestTx.wait();
      console.log("✅ Blood request created successfully");
    } catch (error) {
      console.log("⚠️ Could not create blood request (may need hospital admin role)");
    }
    
    // Demo: Chuyển máu đến bệnh viện
    console.log("\n🚚 Demonstrating blood transfer...");
    try {
      if (stats.totalBloodUnits > 0 && stats.totalHospitals > 0) {
        const transferTx = await bloodBank.transferBloodUnit(
          1, // Blood unit ID
          1, // To hospital ID
          "Emergency transfer for surgery"
        );
        await transferTx.wait();
        console.log("✅ Blood unit transferred successfully");
        
        // Hiển thị lịch sử chuyển máu
        const transferHistory = await bloodBank.getBloodUnitTransferHistory(1);
        console.log(`Transfer history for unit #1: ${transferHistory.length} transfers`);
      }
    } catch (error) {
      console.log("⚠️ Could not transfer blood unit (may need admin role)");
    }
    
  } catch (error) {
    console.error("❌ Error interacting with contract:", error.message);
  }
}

function getBloodTypeName(bloodType) {
  const types = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
  return types[bloodType] || "Unknown";
}

function getStatusName(status) {
  const statuses = ["COLLECTED", "TESTED", "APPROVED", "EXPIRED", "USED", "DISCARDED"];
  return statuses[status] || "Unknown";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });