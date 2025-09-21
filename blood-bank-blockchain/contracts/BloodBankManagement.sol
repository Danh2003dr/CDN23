// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BloodBankManagement
 * @dev Smart contract để quản lý hiến máu và ngân hàng máu trên blockchain
 * Đảm bảo tính minh bạch và chống gian lận trong quy trình hiến máu
 */
contract BloodBankManagement is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Roles
    bytes32 public constant HOSPITAL_ADMIN = keccak256("HOSPITAL_ADMIN");
    bytes32 public constant BLOOD_BANK_ADMIN = keccak256("BLOOD_BANK_ADMIN");
    bytes32 public constant MEDICAL_STAFF = keccak256("MEDICAL_STAFF");
    
    // Counters
    Counters.Counter private _bloodUnitIds;
    Counters.Counter private _donorIds;
    Counters.Counter private _hospitalIds;
    
    // Enums
    enum BloodType { O_NEG, O_POS, A_NEG, A_POS, B_NEG, B_POS, AB_NEG, AB_POS }
    enum BloodUnitStatus { COLLECTED, TESTED, APPROVED, EXPIRED, USED, DISCARDED }
    enum RequestStatus { PENDING, APPROVED, FULFILLED, CANCELLED }
    
    // Structs
    struct Donor {
        uint256 id;
        string name;
        uint256 age;
        BloodType bloodType;
        string contactInfo;
        uint256[] donationHistory;
        bool isActive;
        uint256 registeredAt;
    }
    
    struct BloodUnit {
        uint256 id;
        uint256 donorId;
        BloodType bloodType;
        uint256 collectionDate;
        uint256 expirationDate;
        BloodUnitStatus status;
        string testResults;
        uint256 currentHospitalId;
        uint256[] transferHistory;
        string additionalInfo;
    }
    
    struct Hospital {
        uint256 id;
        string name;
        string location;
        string contactInfo;
        address adminAddress;
        bool isActive;
        uint256 registeredAt;
    }
    
    struct BloodRequest {
        uint256 id;
        uint256 requestingHospitalId;
        BloodType bloodType;
        uint256 unitsRequested;
        uint256 urgencyLevel; // 1-5, 5 being most urgent
        RequestStatus status;
        uint256 requestedAt;
        uint256[] fulfilledUnits;
        string reason;
    }
    
    struct Transfer {
        uint256 bloodUnitId;
        uint256 fromHospitalId;
        uint256 toHospitalId;
        uint256 transferredAt;
        string reason;
        address authorizedBy;
    }
    
    // Mappings
    mapping(uint256 => Donor) public donors;
    mapping(uint256 => BloodUnit) public bloodUnits;
    mapping(uint256 => Hospital) public hospitals;
    mapping(uint256 => BloodRequest) public bloodRequests;
    mapping(address => uint256) public addressToHospitalId;
    mapping(BloodType => uint256[]) public bloodUnitsByType;
    
    // Arrays for iteration
    uint256[] public allDonorIds;
    uint256[] public allBloodUnitIds;
    uint256[] public allHospitalIds;
    uint256[] public allRequestIds;
    Transfer[] public transferHistory;
    
    // Events
    event DonorRegistered(uint256 indexed donorId, string name, BloodType bloodType);
    event BloodUnitCollected(uint256 indexed bloodUnitId, uint256 indexed donorId, BloodType bloodType);
    event BloodUnitTested(uint256 indexed bloodUnitId, string testResults);
    event BloodUnitStatusUpdated(uint256 indexed bloodUnitId, BloodUnitStatus status);
    event HospitalRegistered(uint256 indexed hospitalId, string name, address adminAddress);
    event BloodRequestCreated(uint256 indexed requestId, uint256 indexed hospitalId, BloodType bloodType, uint256 units);
    event BloodUnitTransferred(uint256 indexed bloodUnitId, uint256 fromHospitalId, uint256 toHospitalId);
    event BloodRequestFulfilled(uint256 indexed requestId, uint256[] bloodUnitIds);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BLOOD_BANK_ADMIN, msg.sender);
    }
    
    // Modifier to check if caller is authorized for hospital operations
    modifier onlyHospitalAdmin(uint256 hospitalId) {
        require(
            hasRole(BLOOD_BANK_ADMIN, msg.sender) || 
            (hospitals[hospitalId].adminAddress == msg.sender && hasRole(HOSPITAL_ADMIN, msg.sender)),
            "Not authorized for this hospital"
        );
        _;
    }
    
    /**
     * @dev Đăng ký người hiến máu mới
     */
    function registerDonor(
        string memory name,
        uint256 age,
        BloodType bloodType,
        string memory contactInfo
    ) external onlyRole(MEDICAL_STAFF) returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(age >= 18 && age <= 65, "Invalid age for donation");
        
        _donorIds.increment();
        uint256 donorId = _donorIds.current();
        
        donors[donorId] = Donor({
            id: donorId,
            name: name,
            age: age,
            bloodType: bloodType,
            contactInfo: contactInfo,
            donationHistory: new uint256[](0),
            isActive: true,
            registeredAt: block.timestamp
        });
        
        allDonorIds.push(donorId);
        
        emit DonorRegistered(donorId, name, bloodType);
        return donorId;
    }
    
    /**
     * @dev Ghi nhận đơn vị máu được thu thập
     */
    function collectBloodUnit(
        uint256 donorId,
        string memory additionalInfo
    ) external onlyRole(MEDICAL_STAFF) returns (uint256) {
        require(donors[donorId].isActive, "Donor not active");
        
        _bloodUnitIds.increment();
        uint256 bloodUnitId = _bloodUnitIds.current();
        
        BloodType bloodType = donors[donorId].bloodType;
        uint256 expirationDate = block.timestamp + 42 days; // Máu có thể bảo quản 42 ngày
        
        bloodUnits[bloodUnitId] = BloodUnit({
            id: bloodUnitId,
            donorId: donorId,
            bloodType: bloodType,
            collectionDate: block.timestamp,
            expirationDate: expirationDate,
            status: BloodUnitStatus.COLLECTED,
            testResults: "",
            currentHospitalId: 0, // 0 means in blood bank
            transferHistory: new uint256[](0),
            additionalInfo: additionalInfo
        });
        
        // Cập nhật lịch sử hiến máu của người hiến
        donors[donorId].donationHistory.push(bloodUnitId);
        
        allBloodUnitIds.push(bloodUnitId);
        bloodUnitsByType[bloodType].push(bloodUnitId);
        
        emit BloodUnitCollected(bloodUnitId, donorId, bloodType);
        return bloodUnitId;
    }
    
    /**
     * @dev Cập nhật kết quả xét nghiệm máu
     */
    function updateTestResults(
        uint256 bloodUnitId,
        string memory testResults,
        bool approved
    ) external onlyRole(MEDICAL_STAFF) {
        require(bloodUnits[bloodUnitId].id != 0, "Blood unit not found");
        require(bloodUnits[bloodUnitId].status == BloodUnitStatus.COLLECTED, "Invalid status for testing");
        
        bloodUnits[bloodUnitId].testResults = testResults;
        bloodUnits[bloodUnitId].status = approved ? BloodUnitStatus.APPROVED : BloodUnitStatus.DISCARDED;
        
        emit BloodUnitTested(bloodUnitId, testResults);
        emit BloodUnitStatusUpdated(bloodUnitId, bloodUnits[bloodUnitId].status);
    }
    
    /**
     * @dev Đăng ký bệnh viện mới
     */
    function registerHospital(
        string memory name,
        string memory location,
        string memory contactInfo,
        address adminAddress
    ) external onlyRole(BLOOD_BANK_ADMIN) returns (uint256) {
        require(bytes(name).length > 0, "Hospital name cannot be empty");
        require(adminAddress != address(0), "Invalid admin address");
        
        _hospitalIds.increment();
        uint256 hospitalId = _hospitalIds.current();
        
        hospitals[hospitalId] = Hospital({
            id: hospitalId,
            name: name,
            location: location,
            contactInfo: contactInfo,
            adminAddress: adminAddress,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        addressToHospitalId[adminAddress] = hospitalId;
        allHospitalIds.push(hospitalId);
        
        // Grant hospital admin role
        _grantRole(HOSPITAL_ADMIN, adminAddress);
        
        emit HospitalRegistered(hospitalId, name, adminAddress);
        return hospitalId;
    }
    
    /**
     * @dev Tạo yêu cầu máu từ bệnh viện
     */
    function createBloodRequest(
        BloodType bloodType,
        uint256 unitsRequested,
        uint256 urgencyLevel,
        string memory reason
    ) external onlyRole(HOSPITAL_ADMIN) returns (uint256) {
        uint256 hospitalId = addressToHospitalId[msg.sender];
        require(hospitalId != 0, "Hospital not registered");
        require(unitsRequested > 0, "Must request at least 1 unit");
        require(urgencyLevel >= 1 && urgencyLevel <= 5, "Invalid urgency level");
        
        _bloodUnitIds.increment(); // Reusing counter for request IDs
        uint256 requestId = _bloodUnitIds.current();
        
        bloodRequests[requestId] = BloodRequest({
            id: requestId,
            requestingHospitalId: hospitalId,
            bloodType: bloodType,
            unitsRequested: unitsRequested,
            urgencyLevel: urgencyLevel,
            status: RequestStatus.PENDING,
            requestedAt: block.timestamp,
            fulfilledUnits: new uint256[](0),
            reason: reason
        });
        
        allRequestIds.push(requestId);
        
        emit BloodRequestCreated(requestId, hospitalId, bloodType, unitsRequested);
        return requestId;
    }
    
    /**
     * @dev Chuyển đơn vị máu đến bệnh viện
     */
    function transferBloodUnit(
        uint256 bloodUnitId,
        uint256 toHospitalId,
        string memory reason
    ) external onlyRole(BLOOD_BANK_ADMIN) nonReentrant {
        require(bloodUnits[bloodUnitId].id != 0, "Blood unit not found");
        require(bloodUnits[bloodUnitId].status == BloodUnitStatus.APPROVED, "Blood unit not approved");
        require(hospitals[toHospitalId].isActive, "Hospital not active");
        require(block.timestamp < bloodUnits[bloodUnitId].expirationDate, "Blood unit expired");
        
        uint256 fromHospitalId = bloodUnits[bloodUnitId].currentHospitalId;
        bloodUnits[bloodUnitId].currentHospitalId = toHospitalId;
        
        // Record transfer
        Transfer memory transfer = Transfer({
            bloodUnitId: bloodUnitId,
            fromHospitalId: fromHospitalId,
            toHospitalId: toHospitalId,
            transferredAt: block.timestamp,
            reason: reason,
            authorizedBy: msg.sender
        });
        
        transferHistory.push(transfer);
        bloodUnits[bloodUnitId].transferHistory.push(transferHistory.length - 1);
        
        emit BloodUnitTransferred(bloodUnitId, fromHospitalId, toHospitalId);
    }
    
    /**
     * @dev Đánh dấu đơn vị máu đã được sử dụng
     */
    function markBloodUnitUsed(uint256 bloodUnitId) external {
        uint256 hospitalId = addressToHospitalId[msg.sender];
        require(hospitalId != 0, "Hospital not registered");
        require(hasRole(HOSPITAL_ADMIN, msg.sender) || hasRole(MEDICAL_STAFF, msg.sender), "Not authorized");
        require(bloodUnits[bloodUnitId].currentHospitalId == hospitalId, "Blood unit not in your hospital");
        require(bloodUnits[bloodUnitId].status == BloodUnitStatus.APPROVED, "Blood unit not approved");
        
        bloodUnits[bloodUnitId].status = BloodUnitStatus.USED;
        
        emit BloodUnitStatusUpdated(bloodUnitId, BloodUnitStatus.USED);
    }
    
    /**
     * @dev Lấy thông tin đầy đủ về đơn vị máu
     */
    function getBloodUnitDetails(uint256 bloodUnitId) external view returns (
        uint256 id,
        uint256 donorId,
        BloodType bloodType,
        uint256 collectionDate,
        uint256 expirationDate,
        BloodUnitStatus status,
        string memory testResults,
        uint256 currentHospitalId,
        string memory additionalInfo
    ) {
        BloodUnit memory unit = bloodUnits[bloodUnitId];
        return (
            unit.id,
            unit.donorId,
            unit.bloodType,
            unit.collectionDate,
            unit.expirationDate,
            unit.status,
            unit.testResults,
            unit.currentHospitalId,
            unit.additionalInfo
        );
    }
    
    /**
     * @dev Lấy lịch sử chuyển máu của một đơn vị
     */
    function getBloodUnitTransferHistory(uint256 bloodUnitId) external view returns (Transfer[] memory) {
        uint256[] memory transferIds = bloodUnits[bloodUnitId].transferHistory;
        Transfer[] memory transfers = new Transfer[](transferIds.length);
        
        for (uint256 i = 0; i < transferIds.length; i++) {
            transfers[i] = transferHistory[transferIds[i]];
        }
        
        return transfers;
    }
    
    /**
     * @dev Lấy danh sách đơn vị máu theo loại máu
     */
    function getBloodUnitsByType(BloodType bloodType) external view returns (uint256[] memory) {
        return bloodUnitsByType[bloodType];
    }
    
    /**
     * @dev Lấy danh sách đơn vị máu có sẵn (đã được phê duyệt và chưa hết hạn)
     */
    function getAvailableBloodUnits(BloodType bloodType) external view returns (uint256[] memory) {
        uint256[] memory allUnits = bloodUnitsByType[bloodType];
        uint256[] memory availableUnits = new uint256[](allUnits.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allUnits.length; i++) {
            BloodUnit memory unit = bloodUnits[allUnits[i]];
            if (unit.status == BloodUnitStatus.APPROVED && block.timestamp < unit.expirationDate) {
                availableUnits[count] = allUnits[i];
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = availableUnits[i];
        }
        
        return result;
    }
    
    /**
     * @dev Lấy thống kê tổng quan
     */
    function getSystemStats() external view returns (
        uint256 totalDonors,
        uint256 totalBloodUnits,
        uint256 totalHospitals,
        uint256 totalRequests,
        uint256 totalTransfers
    ) {
        return (
            allDonorIds.length,
            allBloodUnitIds.length,
            allHospitalIds.length,
            allRequestIds.length,
            transferHistory.length
        );
    }
    
    /**
     * @dev Cập nhật trạng thái đơn vị máu hết hạn
     */
    function markExpiredBloodUnits() external {
        for (uint256 i = 0; i < allBloodUnitIds.length; i++) {
            uint256 bloodUnitId = allBloodUnitIds[i];
            BloodUnit storage unit = bloodUnits[bloodUnitId];
            
            if (unit.status == BloodUnitStatus.APPROVED && block.timestamp >= unit.expirationDate) {
                unit.status = BloodUnitStatus.EXPIRED;
                emit BloodUnitStatusUpdated(bloodUnitId, BloodUnitStatus.EXPIRED);
            }
        }
    }
}