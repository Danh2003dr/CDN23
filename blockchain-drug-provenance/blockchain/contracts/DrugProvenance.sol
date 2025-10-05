// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DrugProvenance
 * @dev Smart contract để quản lý nguồn gốc xuất xứ thuốc trên blockchain
 * @notice Hệ thống theo dõi chuỗi cung ứng thuốc từ nhà sản xuất đến bệnh nhân
 */
contract DrugProvenance is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _batchIds;
    
    // Enum định nghĩa các vai trò trong hệ thống
    enum UserRole { 
        PATIENT,      // Bệnh nhân
        MANUFACTURER, // Nhà sản xuất
        DISTRIBUTOR,  // Nhà phân phối
        HOSPITAL,     // Bệnh viện
        ADMIN         // Quản trị viên
    }
    
    // Enum trạng thái lô thuốc trong chuỗi cung ứng
    enum BatchStatus {
        MANUFACTURED,   // Đã sản xuất
        IN_TRANSIT,     // Đang vận chuyển
        DELIVERED,      // Đã giao hàng
        IN_HOSPITAL,    // Tại bệnh viện
        DISPENSED,      // Đã cấp phát
        EXPIRED,        // Hết hạn
        RECALLED        // Thu hồi
    }
    
    // Cấu trúc thông tin người dùng
    struct User {
        address walletAddress;
        string name;
        string contactInfo;
        UserRole role;
        bool isActive;
        uint256 registeredAt;
    }
    
    // Cấu trúc thông tin lô thuốc
    struct DrugBatch {
        uint256 batchId;
        string batchCode;           // Mã lô thuốc
        string drugName;            // Tên thuốc
        string manufacturer;        // Nhà sản xuất
        uint256 manufactureDate;    // Ngày sản xuất
        uint256 expiryDate;        // Hạn sử dụng
        string ingredients;         // Thành phần
        string qualityReport;       // Báo cáo chất lượng
        BatchStatus status;         // Trạng thái hiện tại
        address currentHolder;      // Người nắm giữ hiện tại
        bool isVerified;           // Đã được xác thực
        string qrCode;             // Mã QR
        uint256 createdAt;         // Thời điểm tạo
    }
    
    // Cấu trúc sự kiện chuỗi cung ứng
    struct SupplyChainEvent {
        uint256 batchId;
        address from;              // Người gửi
        address to;                // Người nhận
        string location;           // Vị trí
        string description;        // Mô tả sự kiện
        BatchStatus newStatus;     // Trạng thái mới
        uint256 timestamp;         // Thời điểm
        string additionalData;     // Dữ liệu bổ sung
    }
    
    // Mapping lưu trữ dữ liệu
    mapping(address => User) public users;
    mapping(uint256 => DrugBatch) public drugBatches;
    mapping(uint256 => SupplyChainEvent[]) public supplyChainHistory;
    mapping(string => uint256) public batchCodeToId;
    mapping(address => uint256[]) public userBatches;
    
    // Events
    event UserRegistered(address indexed userAddress, UserRole role, string name);
    event UserRoleUpdated(address indexed userAddress, UserRole oldRole, UserRole newRole);
    event BatchCreated(uint256 indexed batchId, string batchCode, string drugName, address manufacturer);
    event BatchStatusUpdated(uint256 indexed batchId, BatchStatus oldStatus, BatchStatus newStatus);
    event SupplyChainEventAdded(uint256 indexed batchId, address indexed from, address indexed to, BatchStatus newStatus);
    event BatchTransferred(uint256 indexed batchId, address indexed from, address indexed to);
    event BatchVerified(uint256 indexed batchId, address verifier);
    event BatchRecalled(uint256 indexed batchId, string reason);
    
    // Modifiers
    modifier onlyRole(UserRole _role) {
        require(users[msg.sender].role == _role, "Unauthorized: Invalid role");
        require(users[msg.sender].isActive, "Unauthorized: User is inactive");
        _;
    }
    
    modifier onlyActiveUser() {
        require(users[msg.sender].isActive, "Unauthorized: User is inactive");
        _;
    }
    
    modifier batchExists(uint256 _batchId) {
        require(_batchId > 0 && _batchId <= _batchIds.current(), "Batch does not exist");
        _;
    }
    
    modifier onlyBatchHolder(uint256 _batchId) {
        require(drugBatches[_batchId].currentHolder == msg.sender, "Unauthorized: Not batch holder");
        _;
    }
    
    /**
     * @dev Constructor - khởi tạo contract với admin đầu tiên
     */
    constructor() {
        // Đăng ký owner làm admin đầu tiên
        users[msg.sender] = User({
            walletAddress: msg.sender,
            name: "System Administrator", 
            contactInfo: "admin@drugprovenance.com",
            role: UserRole.ADMIN,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        emit UserRegistered(msg.sender, UserRole.ADMIN, "System Administrator");
    }
    
    /**
     * @dev Đăng ký người dùng mới
     */
    function registerUser(
        address _userAddress,
        string memory _name,
        string memory _contactInfo,
        UserRole _role
    ) external onlyRole(UserRole.ADMIN) {
        require(_userAddress != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(!users[_userAddress].isActive, "User already registered");
        
        users[_userAddress] = User({
            walletAddress: _userAddress,
            name: _name,
            contactInfo: _contactInfo,
            role: _role,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        emit UserRegistered(_userAddress, _role, _name);
    }
    
    /**
     * @dev Cập nhật vai trò người dùng
     */
    function updateUserRole(address _userAddress, UserRole _newRole) 
        external onlyRole(UserRole.ADMIN) {
        require(users[_userAddress].isActive, "User not found");
        
        UserRole oldRole = users[_userAddress].role;
        users[_userAddress].role = _newRole;
        
        emit UserRoleUpdated(_userAddress, oldRole, _newRole);
    }
    
    /**
     * @dev Vô hiệu hóa người dùng
     */
    function deactivateUser(address _userAddress) external onlyRole(UserRole.ADMIN) {
        require(users[_userAddress].isActive, "User not found");
        users[_userAddress].isActive = false;
    }
    
    /**
     * @dev Tạo lô thuốc mới (chỉ nhà sản xuất)
     */
    function createBatch(
        string memory _batchCode,
        string memory _drugName,
        string memory _manufacturer,
        uint256 _expiryDate,
        string memory _ingredients,
        string memory _qualityReport,
        string memory _qrCode
    ) external onlyRole(UserRole.MANUFACTURER) nonReentrant returns (uint256) {
        require(bytes(_batchCode).length > 0, "Batch code cannot be empty");
        require(bytes(_drugName).length > 0, "Drug name cannot be empty");
        require(_expiryDate > block.timestamp, "Expiry date must be in future");
        require(batchCodeToId[_batchCode] == 0, "Batch code already exists");
        
        _batchIds.increment();
        uint256 newBatchId = _batchIds.current();
        
        drugBatches[newBatchId] = DrugBatch({
            batchId: newBatchId,
            batchCode: _batchCode,
            drugName: _drugName,
            manufacturer: _manufacturer,
            manufactureDate: block.timestamp,
            expiryDate: _expiryDate,
            ingredients: _ingredients,
            qualityReport: _qualityReport,
            status: BatchStatus.MANUFACTURED,
            currentHolder: msg.sender,
            isVerified: false,
            qrCode: _qrCode,
            createdAt: block.timestamp
        });
        
        batchCodeToId[_batchCode] = newBatchId;
        userBatches[msg.sender].push(newBatchId);
        
        // Thêm sự kiện đầu tiên vào chuỗi cung ứng
        supplyChainHistory[newBatchId].push(SupplyChainEvent({
            batchId: newBatchId,
            from: address(0),
            to: msg.sender,
            location: "Manufacturing Facility",
            description: "Batch manufactured",
            newStatus: BatchStatus.MANUFACTURED,
            timestamp: block.timestamp,
            additionalData: ""
        }));
        
        emit BatchCreated(newBatchId, _batchCode, _drugName, msg.sender);
        return newBatchId;
    }
    
    /**
     * @dev Xác thực lô thuốc (chỉ admin hoặc cơ quan có thẩm quyền)
     */
    function verifyBatch(uint256 _batchId) 
        external onlyRole(UserRole.ADMIN) batchExists(_batchId) {
        drugBatches[_batchId].isVerified = true;
        emit BatchVerified(_batchId, msg.sender);
    }
    
    /**
     * @dev Chuyển giao lô thuốc
     */
    function transferBatch(
        uint256 _batchId,
        address _to,
        string memory _location,
        string memory _description
    ) external onlyActiveUser batchExists(_batchId) onlyBatchHolder(_batchId) {
        require(_to != address(0), "Invalid recipient address");
        require(users[_to].isActive, "Recipient is not active user");
        require(_to != msg.sender, "Cannot transfer to yourself");
        
        DrugBatch storage batch = drugBatches[_batchId];
        
        // Xác định trạng thái mới dựa trên vai trò người nhận
        BatchStatus newStatus = batch.status;
        if (users[_to].role == UserRole.DISTRIBUTOR) {
            newStatus = BatchStatus.IN_TRANSIT;
        } else if (users[_to].role == UserRole.HOSPITAL) {
            newStatus = BatchStatus.IN_HOSPITAL;
        }
        
        // Cập nhật thông tin lô thuốc
        address previousHolder = batch.currentHolder;
        batch.currentHolder = _to;
        batch.status = newStatus;
        
        // Cập nhật danh sách lô thuốc của người dùng
        userBatches[_to].push(_batchId);
        
        // Thêm sự kiện vào chuỗi cung ứng
        supplyChainHistory[_batchId].push(SupplyChainEvent({
            batchId: _batchId,
            from: msg.sender,
            to: _to,
            location: _location,
            description: _description,
            newStatus: newStatus,
            timestamp: block.timestamp,
            additionalData: ""
        }));
        
        emit BatchTransferred(_batchId, msg.sender, _to);
        emit BatchStatusUpdated(_batchId, batch.status, newStatus);
        emit SupplyChainEventAdded(_batchId, msg.sender, _to, newStatus);
    }
    
    /**
     * @dev Cập nhật trạng thái lô thuốc
     */
    function updateBatchStatus(
        uint256 _batchId,
        BatchStatus _newStatus,
        string memory _location,
        string memory _description
    ) external onlyActiveUser batchExists(_batchId) onlyBatchHolder(_batchId) {
        DrugBatch storage batch = drugBatches[_batchId];
        BatchStatus oldStatus = batch.status;
        
        // Kiểm tra tính hợp lệ của việc chuyển trạng thái
        require(_isValidStatusTransition(oldStatus, _newStatus), "Invalid status transition");
        
        batch.status = _newStatus;
        
        // Thêm sự kiện vào chuỗi cung ứng
        supplyChainHistory[_batchId].push(SupplyChainEvent({
            batchId: _batchId,
            from: msg.sender,
            to: msg.sender,
            location: _location,
            description: _description,
            newStatus: _newStatus,
            timestamp: block.timestamp,
            additionalData: ""
        }));
        
        emit BatchStatusUpdated(_batchId, oldStatus, _newStatus);
    }
    
    /**
     * @dev Thu hồi lô thuốc
     */
    function recallBatch(uint256 _batchId, string memory _reason) 
        external onlyRole(UserRole.ADMIN) batchExists(_batchId) {
        DrugBatch storage batch = drugBatches[_batchId];
        batch.status = BatchStatus.RECALLED;
        
        supplyChainHistory[_batchId].push(SupplyChainEvent({
            batchId: _batchId,
            from: msg.sender,
            to: batch.currentHolder,
            location: "System",
            description: _reason,
            newStatus: BatchStatus.RECALLED,
            timestamp: block.timestamp,
            additionalData: _reason
        }));
        
        emit BatchRecalled(_batchId, _reason);
    }
    
    /**
     * @dev Kiểm tra tính hợp lệ của chuyển đổi trạng thái
     */
    function _isValidStatusTransition(BatchStatus _from, BatchStatus _to) 
        private pure returns (bool) {
        if (_from == BatchStatus.MANUFACTURED) {
            return _to == BatchStatus.IN_TRANSIT || _to == BatchStatus.DELIVERED;
        }
        if (_from == BatchStatus.IN_TRANSIT) {
            return _to == BatchStatus.DELIVERED || _to == BatchStatus.IN_HOSPITAL;
        }
        if (_from == BatchStatus.DELIVERED) {
            return _to == BatchStatus.IN_HOSPITAL;
        }
        if (_from == BatchStatus.IN_HOSPITAL) {
            return _to == BatchStatus.DISPENSED;
        }
        return false;
    }
    
    /**
     * @dev Lấy thông tin lô thuốc theo mã QR hoặc batch code
     */
    function getBatchByCode(string memory _batchCode) 
        external view returns (DrugBatch memory) {
        uint256 batchId = batchCodeToId[_batchCode];
        require(batchId > 0, "Batch not found");
        return drugBatches[batchId];
    }
    
    /**
     * @dev Lấy lịch sử chuỗi cung ứng
     */
    function getSupplyChainHistory(uint256 _batchId) 
        external view batchExists(_batchId) returns (SupplyChainEvent[] memory) {
        return supplyChainHistory[_batchId];
    }
    
    /**
     * @dev Lấy danh sách lô thuốc của người dùng
     */
    function getUserBatches(address _userAddress) 
        external view returns (uint256[] memory) {
        return userBatches[_userAddress];
    }
    
    /**
     * @dev Kiểm tra tính xác thực của lô thuốc
     */
    function verifyBatchAuthenticity(string memory _batchCode) 
        external view returns (bool authentic, DrugBatch memory batch) {
        uint256 batchId = batchCodeToId[_batchCode];
        if (batchId == 0) {
            return (false, DrugBatch(0, "", "", "", 0, 0, "", "", BatchStatus.MANUFACTURED, address(0), false, "", 0));
        }
        
        DrugBatch memory batchInfo = drugBatches[batchId];
        
        // Kiểm tra các tiêu chí xác thực
        bool isAuthentic = batchInfo.isVerified && 
                          batchInfo.status != BatchStatus.RECALLED &&
                          batchInfo.expiryDate > block.timestamp;
        
        return (isAuthentic, batchInfo);
    }
    
    /**
     * @dev Lấy thống kê tổng quan
     */
    function getSystemStats() external view returns (
        uint256 totalBatches,
        uint256 verifiedBatches, 
        uint256 recalledBatches,
        uint256 expiredBatches
    ) {
        uint256 verified = 0;
        uint256 recalled = 0; 
        uint256 expired = 0;
        
        for (uint256 i = 1; i <= _batchIds.current(); i++) {
            DrugBatch memory batch = drugBatches[i];
            if (batch.isVerified) verified++;
            if (batch.status == BatchStatus.RECALLED) recalled++;
            if (batch.expiryDate <= block.timestamp) expired++;
        }
        
        return (_batchIds.current(), verified, recalled, expired);
    }
}