const hre = require("hardhat");

async function main() {
  console.log("🩸 Deploying Blood Bank Management System...");
  
  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the BloodBankManagement contract
  const BloodBankManagement = await hre.ethers.getContractFactory("BloodBankManagement");
  const bloodBank = await BloodBankManagement.deploy();

  await bloodBank.deployed();

  console.log("✅ BloodBankManagement deployed to:", bloodBank.address);
  
  // Setup initial roles and data
  console.log("\n🔧 Setting up initial configuration...");
  
  // Grant roles to deployer for testing
  const MEDICAL_STAFF = await bloodBank.MEDICAL_STAFF();
  const BLOOD_BANK_ADMIN = await bloodBank.BLOOD_BANK_ADMIN();
  
  await bloodBank.grantRole(MEDICAL_STAFF, deployer.address);
  console.log("✅ Medical staff role granted to deployer");
  
  // Register a test hospital
  const hospitalTx = await bloodBank.registerHospital(
    "Bệnh viện Bạch Mai",
    "Hà Nội, Việt Nam", 
    "contact@bachmai.gov.vn",
    deployer.address
  );
  await hospitalTx.wait();
  console.log("✅ Test hospital registered");
  
  // Register test donors
  const donorTx1 = await bloodBank.registerDonor(
    "Nguyễn Văn A",
    25,
    0, // O_NEG
    "nguyenvana@email.com"
  );
  await donorTx1.wait();
  
  const donorTx2 = await bloodBank.registerDonor(
    "Trần Thị B", 
    30,
    3, // A_POS
    "tranthib@email.com"
  );
  await donorTx2.wait();
  console.log("✅ Test donors registered");
  
  // Collect blood units
  const collectTx1 = await bloodBank.collectBloodUnit(1, "Người hiến khỏe mạnh, không có bệnh lý");
  await collectTx1.wait();
  
  const collectTx2 = await bloodBank.collectBloodUnit(2, "Người hiến khỏe mạnh, đã hiến máu 3 lần trước");
  await collectTx2.wait();
  console.log("✅ Test blood units collected");
  
  // Update test results
  const testTx1 = await bloodBank.updateTestResults(1, "HIV(-), HBV(-), HCV(-), Syphilis(-)", true);
  await testTx1.wait();
  
  const testTx2 = await bloodBank.updateTestResults(2, "HIV(-), HBV(-), HCV(-), Syphilis(-)", true);
  await testTx2.wait();
  console.log("✅ Test results updated");
  
  console.log("\n📊 System Statistics:");
  const stats = await bloodBank.getSystemStats();
  console.log(`- Total Donors: ${stats.totalDonors}`);
  console.log(`- Total Blood Units: ${stats.totalBloodUnits}`); 
  console.log(`- Total Hospitals: ${stats.totalHospitals}`);
  console.log(`- Total Requests: ${stats.totalRequests}`);
  console.log(`- Total Transfers: ${stats.totalTransfers}`);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("Contract Address:", bloodBank.address);
  console.log("Network:", hre.network.name);
  
  return bloodBank.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });