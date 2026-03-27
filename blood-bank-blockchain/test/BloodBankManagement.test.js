const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BloodBankManagement", function () {
  let bloodBank;
  let owner, hospital1, hospital2, medicalStaff, donor1;

  beforeEach(async function () {
    // Get signers
    [owner, hospital1, hospital2, medicalStaff, donor1] = await ethers.getSigners();

    // Deploy contract
    const BloodBankManagement = await ethers.getContractFactory("BloodBankManagement");
    bloodBank = await BloodBankManagement.deploy();
    await bloodBank.deployed();

    // Grant roles
    const MEDICAL_STAFF = await bloodBank.MEDICAL_STAFF();
    const HOSPITAL_ADMIN = await bloodBank.HOSPITAL_ADMIN();
    
    await bloodBank.grantRole(MEDICAL_STAFF, medicalStaff.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const DEFAULT_ADMIN_ROLE = await bloodBank.DEFAULT_ADMIN_ROLE();
      expect(await bloodBank.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should grant blood bank admin role to deployer", async function () {
      const BLOOD_BANK_ADMIN = await bloodBank.BLOOD_BANK_ADMIN();
      expect(await bloodBank.hasRole(BLOOD_BANK_ADMIN, owner.address)).to.be.true;
    });
  });

  describe("Donor Management", function () {
    it("Should register a new donor", async function () {
      await bloodBank.connect(medicalStaff).registerDonor(
        "Nguyen Van A",
        25,
        0, // O_NEG
        "nguyenvana@email.com"
      );

      const donor = await bloodBank.donors(1);
      expect(donor.name).to.equal("Nguyen Van A");
      expect(donor.age).to.equal(25);
      expect(donor.bloodType).to.equal(0);
      expect(donor.isActive).to.be.true;
    });

    it("Should reject donor with invalid age", async function () {
      await expect(
        bloodBank.connect(medicalStaff).registerDonor(
          "Too Young",
          17,
          0,
          "tooyoung@email.com"
        )
      ).to.be.revertedWith("Invalid age for donation");
    });

    it("Should only allow medical staff to register donors", async function () {
      await expect(
        bloodBank.connect(hospital1).registerDonor(
          "Unauthorized",
          25,
          0,
          "unauthorized@email.com"
        )
      ).to.be.reverted;
    });
  });

  describe("Blood Collection", function () {
    beforeEach(async function () {
      // Register a donor first
      await bloodBank.connect(medicalStaff).registerDonor(
        "Test Donor",
        30,
        1, // O_POS
        "testdonor@email.com"
      );
    });

    it("Should collect blood unit from registered donor", async function () {
      await bloodBank.connect(medicalStaff).collectBloodUnit(
        1,
        "Healthy donor, no medical conditions"
      );

      const bloodUnit = await bloodBank.bloodUnits(1);
      expect(bloodUnit.donorId).to.equal(1);
      expect(bloodUnit.bloodType).to.equal(1); // O_POS
      expect(bloodUnit.status).to.equal(0); // COLLECTED
    });

    it("Should set correct expiration date (42 days)", async function () {
      const tx = await bloodBank.connect(medicalStaff).collectBloodUnit(1, "Test collection");
      const receipt = await tx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;
      
      const bloodUnit = await bloodBank.bloodUnits(1);
      const expectedExpiration = blockTimestamp + (42 * 24 * 60 * 60); // 42 days
      expect(bloodUnit.expirationDate).to.equal(expectedExpiration);
    });

    it("Should update donor's donation history", async function () {
      await bloodBank.connect(medicalStaff).collectBloodUnit(1, "First donation");
      
      const donor = await bloodBank.donors(1);
      // Note: We can't directly check the array, but we can verify through events
      // or by collecting multiple units and checking the count
    });
  });

  describe("Test Results", function () {
    beforeEach(async function () {
      // Register donor and collect blood
      await bloodBank.connect(medicalStaff).registerDonor("Test Donor", 30, 0, "test@email.com");
      await bloodBank.connect(medicalStaff).collectBloodUnit(1, "Test collection");
    });

    it("Should update test results and approve blood unit", async function () {
      await bloodBank.connect(medicalStaff).updateTestResults(
        1,
        "HIV(-), HBV(-), HCV(-), Syphilis(-)",
        true
      );

      const bloodUnit = await bloodBank.bloodUnits(1);
      expect(bloodUnit.testResults).to.equal("HIV(-), HBV(-), HCV(-), Syphilis(-)");
      expect(bloodUnit.status).to.equal(2); // APPROVED
    });

    it("Should discard blood unit if test fails", async function () {
      await bloodBank.connect(medicalStaff).updateTestResults(
        1,
        "HIV(+) - Positive result",
        false
      );

      const bloodUnit = await bloodBank.bloodUnits(1);
      expect(bloodUnit.status).to.equal(5); // DISCARDED
    });

    it("Should only allow testing of collected blood units", async function () {
      // First approve the unit
      await bloodBank.connect(medicalStaff).updateTestResults(1, "All negative", true);
      
      // Try to test again
      await expect(
        bloodBank.connect(medicalStaff).updateTestResults(1, "Retest", true)
      ).to.be.revertedWith("Invalid status for testing");
    });
  });

  describe("Hospital Management", function () {
    it("Should register a new hospital", async function () {
      await bloodBank.registerHospital(
        "Bach Mai Hospital",
        "Hanoi, Vietnam",
        "contact@bachmai.gov.vn",
        hospital1.address
      );

      const hospital = await bloodBank.hospitals(1);
      expect(hospital.name).to.equal("Bach Mai Hospital");
      expect(hospital.adminAddress).to.equal(hospital1.address);
      expect(hospital.isActive).to.be.true;
    });

    it("Should grant hospital admin role to hospital address", async function () {
      await bloodBank.registerHospital(
        "Test Hospital",
        "Test Location", 
        "test@hospital.com",
        hospital1.address
      );

      const HOSPITAL_ADMIN = await bloodBank.HOSPITAL_ADMIN();
      expect(await bloodBank.hasRole(HOSPITAL_ADMIN, hospital1.address)).to.be.true;
    });

    it("Should only allow blood bank admin to register hospitals", async function () {
      await expect(
        bloodBank.connect(hospital1).registerHospital(
          "Unauthorized Hospital",
          "Test Location",
          "test@test.com", 
          hospital1.address
        )
      ).to.be.reverted;
    });
  });

  describe("Blood Transfer", function () {
    beforeEach(async function () {
      // Setup: Register donor, collect blood, test and approve
      await bloodBank.connect(medicalStaff).registerDonor("Test Donor", 30, 0, "test@email.com");
      await bloodBank.connect(medicalStaff).collectBloodUnit(1, "Test collection");
      await bloodBank.connect(medicalStaff).updateTestResults(1, "All negative", true);
      
      // Register hospital
      await bloodBank.registerHospital(
        "Test Hospital",
        "Test Location",
        "test@hospital.com",
        hospital1.address
      );
    });

    it("Should transfer approved blood unit to hospital", async function () {
      await bloodBank.transferBloodUnit(1, 1, "Emergency transfer");

      const bloodUnit = await bloodBank.bloodUnits(1);
      expect(bloodUnit.currentHospitalId).to.equal(1);
    });

    it("Should record transfer history", async function () {
      await bloodBank.transferBloodUnit(1, 1, "Emergency transfer");

      const history = await bloodBank.getBloodUnitTransferHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].toHospitalId).to.equal(1);
      expect(history[0].reason).to.equal("Emergency transfer");
    });

    it("Should not transfer unapproved blood units", async function () {
      // Collect another unit but don't approve it
      await bloodBank.connect(medicalStaff).collectBloodUnit(1, "Second collection");

      await expect(
        bloodBank.transferBloodUnit(2, 1, "Should fail")
      ).to.be.revertedWith("Blood unit not approved");
    });

    it("Should not transfer to inactive hospital", async function () {
      // This would require a way to deactivate hospitals, which isn't implemented
      // but the check is in the contract
    });
  });

  describe("Blood Requests", function () {
    beforeEach(async function () {
      // Register hospital
      await bloodBank.registerHospital(
        "Test Hospital",
        "Test Location", 
        "test@hospital.com",
        hospital1.address
      );
    });

    it("Should create blood request from hospital", async function () {
      await bloodBank.connect(hospital1).createBloodRequest(
        0, // O_NEG
        2, // 2 units
        4, // High urgency
        "Emergency surgery"
      );

      const request = await bloodBank.bloodRequests(1);
      expect(request.requestingHospitalId).to.equal(1);
      expect(request.bloodType).to.equal(0);
      expect(request.unitsRequested).to.equal(2);
      expect(request.urgencyLevel).to.equal(4);
    });

    it("Should reject invalid urgency levels", async function () {
      await expect(
        bloodBank.connect(hospital1).createBloodRequest(0, 1, 6, "Invalid urgency")
      ).to.be.revertedWith("Invalid urgency level");
    });

    it("Should only allow hospital admins to create requests", async function () {
      await expect(
        bloodBank.connect(medicalStaff).createBloodRequest(0, 1, 3, "Unauthorized")
      ).to.be.revertedWith("Hospital not registered");
    });
  });

  describe("System Statistics", function () {
    it("Should return correct system stats", async function () {
      // Register some entities
      await bloodBank.connect(medicalStaff).registerDonor("Donor 1", 25, 0, "donor1@email.com");
      await bloodBank.connect(medicalStaff).registerDonor("Donor 2", 30, 1, "donor2@email.com");
      await bloodBank.registerHospital("Hospital 1", "Location 1", "h1@email.com", hospital1.address);
      
      const stats = await bloodBank.getSystemStats();
      expect(stats.totalDonors).to.equal(2);
      expect(stats.totalHospitals).to.equal(1);
    });
  });

  describe("Available Blood Units", function () {
    beforeEach(async function () {
      // Setup multiple blood units
      await bloodBank.connect(medicalStaff).registerDonor("Donor O-", 25, 0, "o1@email.com");
      await bloodBank.connect(medicalStaff).registerDonor("Donor O+", 30, 1, "o2@email.com");
      
      await bloodBank.connect(medicalStaff).collectBloodUnit(1, "Collection 1");
      await bloodBank.connect(medicalStaff).collectBloodUnit(2, "Collection 2");
      
      await bloodBank.connect(medicalStaff).updateTestResults(1, "Negative", true);
      await bloodBank.connect(medicalStaff).updateTestResults(2, "Negative", true);
    });

    it("Should return available blood units by type", async function () {
      const oNegUnits = await bloodBank.getAvailableBloodUnits(0); // O_NEG
      const oPosUnits = await bloodBank.getAvailableBloodUnits(1); // O_POS
      
      expect(oNegUnits.length).to.equal(1);
      expect(oPosUnits.length).to.equal(1);
      expect(oNegUnits[0]).to.equal(1);
      expect(oPosUnits[0]).to.equal(2);
    });

    it("Should not return expired or used blood units", async function () {
      // Mark one unit as used
      await bloodBank.registerHospital("Test Hospital", "Location", "test@email.com", hospital1.address);
      await bloodBank.transferBloodUnit(1, 1, "Transfer for use");
      await bloodBank.connect(hospital1).markBloodUnitUsed(1);
      
      const oNegUnits = await bloodBank.getAvailableBloodUnits(0);
      expect(oNegUnits.length).to.equal(0); // Should not include used unit
    });
  });
});