// User roles
export enum UserRole {
  PATIENT = 'PATIENT',
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  HOSPITAL = 'HOSPITAL',
  ADMIN = 'ADMIN'
}

// User permissions
export enum Permission {
  CREATE_BATCH = 'CREATE_BATCH',
  UPDATE_BATCH = 'UPDATE_BATCH',
  VERIFY_BATCH = 'VERIFY_BATCH',
  TRANSFER_BATCH = 'TRANSFER_BATCH',
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
  RECALL_BATCH = 'RECALL_BATCH'
}

// Batch status
export enum BatchStatus {
  MANUFACTURED = 'MANUFACTURED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  IN_HOSPITAL = 'IN_HOSPITAL',
  DISPENSED = 'DISPENSED',
  EXPIRED = 'EXPIRED',
  RECALLED = 'RECALLED'
}

// Drug forms
export enum DrugForm {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  SYRUP = 'SYRUP',
  INJECTION = 'INJECTION',
  CREAM = 'CREAM',
  DROPS = 'DROPS',
  OTHER = 'OTHER'
}

// Task status
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

// Priority levels
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

// User interface types
export interface User {
  id: string;
  walletAddress: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: Address;
  role: UserRole;
  permissions: Permission[];
  organizationInfo?: OrganizationInfo;
  isEmailVerified: boolean;
  isFirstLogin: boolean;
  preferences: UserPreferences;
  profileImage?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface OrganizationInfo {
  name?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  establishedDate?: string;
  description?: string;
  website?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface UserPreferences {
  language: 'vi' | 'en';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  timezone: string;
}

// Drug Batch interfaces
export interface DrugBatch {
  id: string;
  blockchainId: number;
  transactionHash: string;
  batchCode: string;
  drugName: string;
  genericName?: string;
  drugForm: DrugForm;
  strength?: {
    value: number;
    unit: string;
  };
  manufacturer: ManufacturerInfo;
  manufactureDate: string;
  expiryDate: string;
  ingredients: Ingredient[];
  qualityTests: QualityTest[];
  packageInfo: PackageInfo;
  storageConditions: StorageConditions;
  regulatoryInfo: RegulatoryInfo;
  currentStatus: BatchStatus;
  currentHolder: HolderInfo;
  location?: LocationInfo;
  qrCode: QRCodeInfo;
  isVerified: boolean;
  verificationDate?: string;
  verifiedBy?: VerificationInfo;
  recallInfo: RecallInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturerInfo {
  name: string;
  address?: string;
  licenseNumber?: string;
  walletAddress: string;
}

export interface HolderInfo {
  walletAddress: string;
  name: string;
  role: UserRole;
}

export interface Ingredient {
  name: string;
  concentration?: string;
  purpose: 'ACTIVE' | 'INACTIVE' | 'PRESERVATIVE' | 'EXCIPIENT';
}

export interface QualityTest {
  testType: 'ASSAY' | 'DISSOLUTION' | 'MICROBIAL' | 'STABILITY' | 'IMPURITY';
  result: 'PASS' | 'FAIL' | 'PENDING';
  testDate: string;
  laboratory?: string;
  certificateNumber?: string;
  notes?: string;
}

export interface PackageInfo {
  packageType?: 'BLISTER' | 'BOTTLE' | 'VIAL' | 'TUBE' | 'BOX';
  unitsPerPackage?: number;
  totalPackages?: number;
  packageSize?: string;
}

export interface StorageConditions {
  temperature?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  humidity?: {
    min: number;
    max: number;
  };
  lightCondition?: 'PROTECT_FROM_LIGHT' | 'NORMAL' | 'DARK';
  specialConditions?: string[];
}

export interface RegulatoryInfo {
  registrationNumber?: string;
  approvalDate?: string;
  regulatoryAuthority?: string;
  classification?: 'OTC' | 'PRESCRIPTION' | 'CONTROLLED';
}

export interface LocationInfo {
  facility?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface QRCodeInfo {
  data: string;
  imageUrl: string;
  generatedAt: string;
}

export interface VerificationInfo {
  walletAddress: string;
  name: string;
  authority: string;
}

export interface RecallInfo {
  isRecalled: boolean;
  recallDate?: string;
  reason?: string;
  severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recalledBy?: string;
}

// Supply Chain interfaces
export interface SupplyChainEvent {
  id: string;
  batchId: number;
  blockchainEventId: number;
  transactionHash: string;
  fromAddress?: string;
  toAddress: string;
  fromEntity?: EntityInfo;
  toEntity: EntityInfo;
  eventType: EventType;
  description: string;
  newStatus: BatchStatus;
  previousStatus?: BatchStatus;
  location?: LocationInfo;
  conditions?: TransportConditions;
  transportInfo?: TransportInfo;
  verification: EventVerification;
  quantity?: QuantityInfo;
  additionalData?: any;
  notes?: string;
  tags?: string[];
  blockchainTimestamp: string;
  isAutomated: boolean;
  hasAlert: boolean;
  alertLevel?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

export enum EventType {
  MANUFACTURE = 'MANUFACTURE',
  QUALITY_TEST = 'QUALITY_TEST',
  TRANSFER = 'TRANSFER',
  RECEIVE = 'RECEIVE',
  STORE = 'STORE',
  DISPENSE = 'DISPENSE',
  RECALL = 'RECALL',
  DESTROY = 'DESTROY',
  QUALITY_ALERT = 'QUALITY_ALERT',
  TEMPERATURE_LOG = 'TEMPERATURE_LOG',
  STATUS_UPDATE = 'STATUS_UPDATE'
}

export interface EntityInfo {
  name: string;
  type: UserRole;
  address?: string;
  contactInfo?: string;
}

export interface TransportConditions {
  temperature?: {
    recorded: number;
    unit: 'C' | 'F';
  };
  humidity?: number;
  notes?: string;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_MONITORED';
}

export interface TransportInfo {
  method?: 'TRUCK' | 'AIRCRAFT' | 'SHIP' | 'RAIL' | 'COURIER' | 'PICKUP';
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  vehicleId?: string;
  driverInfo?: {
    name: string;
    license: string;
    contact: string;
  };
}

export interface EventVerification {
  isVerified: boolean;
  verifiedBy?: {
    name: string;
    walletAddress: string;
    timestamp: string;
  };
  signature?: string;
  documents?: EventDocument[];
}

export interface EventDocument {
  type: 'INVOICE' | 'RECEIPT' | 'CERTIFICATE' | 'PHOTO' | 'TEMPERATURE_LOG';
  filename: string;
  path: string;
  uploadedAt: string;
}

export interface QuantityInfo {
  transferred?: number;
  received?: number;
  unit: 'PIECES' | 'BOXES' | 'PACKAGES' | 'KG' | 'LITERS';
  notes?: string;
}

// Task interfaces
export interface Task {
  id: string;
  title: string;
  description: string;
  relatedBatch?: {
    batchId: number;
    batchCode: string;
  };
  assignedBy: TaskUser;
  assignedTo: TaskUser;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  taskType: TaskType;
  details: TaskDetails;
  attachments: TaskAttachment[];
  updates: TaskUpdate[];
  evaluation?: TaskEvaluation;
  tags?: string[];
  notes?: string;
  isUrgent: boolean;
  requiresApproval: boolean;
  approvedBy?: TaskApproval;
  createdAt: string;
  updatedAt: string;
}

export enum TaskType {
  BATCH_TRANSFER = 'BATCH_TRANSFER',
  QUALITY_CHECK = 'QUALITY_CHECK',
  DELIVERY = 'DELIVERY',
  INVENTORY = 'INVENTORY',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  DOCUMENTATION = 'DOCUMENTATION',
  TEMPERATURE_MONITOR = 'TEMPERATURE_MONITOR',
  RECALL_PROCESS = 'RECALL_PROCESS',
  VERIFICATION = 'VERIFICATION',
  OTHER = 'OTHER'
}

export interface TaskUser {
  walletAddress: string;
  name: string;
  role: string;
}

export interface TaskDetails {
  location?: LocationInfo;
  instructions?: string;
  requirements?: string[];
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface TaskAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  path: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TaskUpdate {
  updatedBy: TaskUser;
  message: string;
  progress?: number;
  status?: string;
  attachments?: TaskAttachment[];
  timestamp: string;
}

export interface TaskEvaluation {
  rating: number;
  feedback: string;
  evaluatedBy: TaskUser;
  evaluatedAt: string;
  criteria?: EvaluationCriteria[];
}

export interface EvaluationCriteria {
  name: string;
  score: number;
}

export interface TaskApproval {
  walletAddress: string;
  name: string;
  approvedAt: string;
}

// Notification interfaces
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: Priority;
  sender: NotificationUser;
  recipients: NotificationRecipient[];
  targetGroups?: UserRole[];
  relatedEntity?: RelatedEntity;
  content: NotificationContent;
  attachments?: NotificationAttachment[];
  deliverySettings: DeliverySettings;
  status: NotificationStatus;
  stats: NotificationStats;
  tags?: string[];
  isPublic: boolean;
  isUrgent: boolean;
  category?: string;
  isAutoGenerated: boolean;
  triggerEvent?: string;
  requiresApproval: boolean;
  approvedBy?: NotificationApproval;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  BATCH_UPDATE = 'BATCH_UPDATE',
  TRANSFER = 'TRANSFER',
  QUALITY_ALERT = 'QUALITY_ALERT',
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  RECALL = 'RECALL',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  COMPLIANCE_ALERT = 'COMPLIANCE_ALERT',
  VERIFICATION = 'VERIFICATION',
  GENERAL = 'GENERAL'
}

export enum NotificationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface NotificationUser {
  walletAddress: string;
  name: string;
  role: string;
}

export interface NotificationRecipient {
  walletAddress: string;
  name: string;
  role: string;
  readAt?: string;
  isRead: boolean;
}

export interface RelatedEntity {
  type: 'BATCH' | 'TASK' | 'USER' | 'SUPPLY_CHAIN_EVENT';
  id: string | number;
  reference?: string;
}

export interface NotificationContent {
  shortDescription?: string;
  longDescription?: string;
  actionRequired: boolean;
  actionDeadline?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  path: string;
  size: number;
  uploadedAt: string;
}

export interface DeliverySettings {
  channels: DeliveryChannel[];
  scheduleTime?: string;
  expiryTime?: string;
  isScheduled: boolean;
}

export interface DeliveryChannel {
  type: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  enabled: boolean;
}

export interface NotificationStats {
  totalRecipients: number;
  readCount: number;
  deliveredCount: number;
  lastReadAt?: string;
}

export interface NotificationApproval {
  walletAddress: string;
  name: string;
  approvedAt: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

// Form interfaces
export interface LoginForm {
  identifier: string;
  password: string;
}

export interface RegisterForm {
  walletAddress: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  organizationInfo?: OrganizationInfo;
}

export interface BatchForm {
  batchCode: string;
  drugName: string;
  genericName?: string;
  drugForm: DrugForm;
  strength?: {
    value: number;
    unit: string;
  };
  expiryDate: string;
  ingredients: Ingredient[];
  qualityTests?: QualityTest[];
  packageInfo?: PackageInfo;
  storageConditions?: StorageConditions;
  regulatoryInfo?: RegulatoryInfo;
}

export interface TransferForm {
  toAddress: string;
  toName: string;
  location?: string;
  description?: string;
  transportInfo?: TransportInfo;
}

// QR Code interfaces
export interface QRScanResult {
  success: boolean;
  data?: {
    batch?: DrugBatch;
    supplyChain?: SupplyChainEvent[];
    verification?: {
      isValid: boolean;
      isExpired?: boolean;
      isAuthentic?: boolean;
      verifiedOnBlockchain?: boolean;
    };
  };
  message?: string;
}

// Statistics interfaces
export interface SystemStats {
  totalBatches: number;
  verifiedBatches: number;
  recalledBatches: number;
  expiredBatches: number;
  totalUsers: number;
  activeUsers: number;
  pendingTasks: number;
  criticalAlerts: number;
}

export interface UserStats {
  batchesCreated?: number;
  batchesTransferred?: number;
  tasksCompleted?: number;
  notificationsUnread?: number;
}

// Application state interfaces
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  batches: DrugBatch[];
  tasks: Task[];
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}