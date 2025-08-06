const messages = {
  en: {
    // Authentication messages
    auth: {
      invalidCredentials: 'Invalid email or password',
      accountLocked: 'Account is locked',
      tooManyAttempts: 'Too many login attempts',
      tokenExpired: 'Token expired',
      invalidToken: 'Invalid token',
      accessDenied: 'Access denied',
      userNotFound: 'User not found',
      userInactive: 'User account is inactive',
      passwordMismatch: 'Passwords do not match',
      emailAlreadyExists: 'Email already exists',
      usernameAlreadyExists: 'Username already exists',
      registrationSuccess: 'Account created successfully',
      loginSuccess: 'Login successful',
      logoutSuccess: 'Logout successful',
      passwordChanged: 'Password changed successfully',
      profileUpdated: 'Profile updated successfully',
      userCreated: 'User created successfully',
      userUpdated: 'User updated successfully',
      userDeleted: 'User deleted successfully',
      userActivated: 'User activated successfully',
      userDeactivated: 'User deactivated successfully'
    },
    // Validation messages
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 6 characters',
      usernameRequired: 'Username is required',
      usernameMinLength: 'Username must be at least 3 characters',
      firstNameMinLength: 'First name must be at least 2 characters',
      lastNameMinLength: 'Last name must be at least 2 characters',
      roleIdInvalid: 'Invalid role ID',
      isActiveBoolean: 'is_active must be boolean',
      currentPasswordRequired: 'Current password is required',
      newPasswordRequired: 'New password is required'
    },
    // Node management messages
    nodes: {
      nodeNotFound: 'Node not found',
      nodeCreated: 'Node created successfully',
      nodeUpdated: 'Node updated successfully',
      nodeDeleted: 'Node deleted successfully',
      nodeNameRequired: 'Node name is required',
      hostnameRequired: 'Hostname is required',
      ipAddressRequired: 'IP address is required',
      ipAddressInvalid: 'Invalid IP address format',
      locationRequired: 'Location is required',
      nodeTypeInvalid: 'Invalid node type',
      capacityInvalid: 'Invalid capacity value',
      bandwidthInvalid: 'Invalid bandwidth value'
    },
    // Alert messages
    alerts: {
      alertNotFound: 'Alert not found',
      alertCreated: 'Alert created successfully',
      alertUpdated: 'Alert updated successfully',
      alertResolved: 'Alert resolved successfully',
      alertDeleted: 'Alert deleted successfully',
      alertTypeInvalid: 'Invalid alert type',
      severityInvalid: 'Invalid severity level',
      messageRequired: 'Alert message is required'
    },
    // Content management messages
    content: {
      contentNotFound: 'Content not found',
      contentUploaded: 'Content uploaded successfully',
      contentUpdated: 'Content updated successfully',
      contentDeleted: 'Content deleted successfully',
      fileUploadError: 'File upload error',
      fileSizeExceeded: 'File size exceeded limit',
      fileTypeNotAllowed: 'File type not allowed',
      contentDistributed: 'Content distributed successfully',
      cacheInvalidated: 'Cache invalidated successfully'
    },
    // System messages
    system: {
      serverError: 'Internal server error',
      databaseError: 'Database error',
      networkError: 'Network error',
      permissionDenied: 'Permission denied',
      resourceNotFound: 'Resource not found',
      invalidRequest: 'Invalid request',
      operationFailed: 'Operation failed',
      operationSuccess: 'Operation completed successfully'
    }
  },
  vi: {
    // Authentication messages
    auth: {
      invalidCredentials: 'Email hoặc mật khẩu không đúng',
      accountLocked: 'Tài khoản đã bị khóa',
      tooManyAttempts: 'Quá nhiều lần thử đăng nhập',
      tokenExpired: 'Token đã hết hạn',
      invalidToken: 'Token không hợp lệ',
      accessDenied: 'Truy cập bị từ chối',
      userNotFound: 'Không tìm thấy người dùng',
      userInactive: 'Tài khoản người dùng không hoạt động',
      passwordMismatch: 'Mật khẩu không khớp',
      emailAlreadyExists: 'Email đã tồn tại',
      usernameAlreadyExists: 'Tên đăng nhập đã tồn tại',
      registrationSuccess: 'Tạo tài khoản thành công',
      loginSuccess: 'Đăng nhập thành công',
      logoutSuccess: 'Đăng xuất thành công',
      passwordChanged: 'Đổi mật khẩu thành công',
      profileUpdated: 'Cập nhật hồ sơ thành công',
      userCreated: 'Tạo người dùng thành công',
      userUpdated: 'Cập nhật người dùng thành công',
      userDeleted: 'Xóa người dùng thành công',
      userActivated: 'Kích hoạt người dùng thành công',
      userDeactivated: 'Vô hiệu hóa người dùng thành công'
    },
    // Validation messages
    validation: {
      emailRequired: 'Email là bắt buộc',
      emailInvalid: 'Vui lòng nhập địa chỉ email hợp lệ',
      passwordRequired: 'Mật khẩu là bắt buộc',
      passwordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',
      usernameRequired: 'Tên đăng nhập là bắt buộc',
      usernameMinLength: 'Tên đăng nhập phải có ít nhất 3 ký tự',
      firstNameMinLength: 'Tên phải có ít nhất 2 ký tự',
      lastNameMinLength: 'Họ phải có ít nhất 2 ký tự',
      roleIdInvalid: 'ID vai trò không hợp lệ',
      isActiveBoolean: 'is_active phải là boolean',
      currentPasswordRequired: 'Mật khẩu hiện tại là bắt buộc',
      newPasswordRequired: 'Mật khẩu mới là bắt buộc'
    },
    // Node management messages
    nodes: {
      nodeNotFound: 'Không tìm thấy node',
      nodeCreated: 'Tạo node thành công',
      nodeUpdated: 'Cập nhật node thành công',
      nodeDeleted: 'Xóa node thành công',
      nodeNameRequired: 'Tên node là bắt buộc',
      hostnameRequired: 'Hostname là bắt buộc',
      ipAddressRequired: 'Địa chỉ IP là bắt buộc',
      ipAddressInvalid: 'Định dạng địa chỉ IP không hợp lệ',
      locationRequired: 'Vị trí là bắt buộc',
      nodeTypeInvalid: 'Loại node không hợp lệ',
      capacityInvalid: 'Giá trị dung lượng không hợp lệ',
      bandwidthInvalid: 'Giá trị băng thông không hợp lệ'
    },
    // Alert messages
    alerts: {
      alertNotFound: 'Không tìm thấy cảnh báo',
      alertCreated: 'Tạo cảnh báo thành công',
      alertUpdated: 'Cập nhật cảnh báo thành công',
      alertResolved: 'Giải quyết cảnh báo thành công',
      alertDeleted: 'Xóa cảnh báo thành công',
      alertTypeInvalid: 'Loại cảnh báo không hợp lệ',
      severityInvalid: 'Mức độ nghiêm trọng không hợp lệ',
      messageRequired: 'Thông báo cảnh báo là bắt buộc'
    },
    // Content management messages
    content: {
      contentNotFound: 'Không tìm thấy nội dung',
      contentUploaded: 'Tải lên nội dung thành công',
      contentUpdated: 'Cập nhật nội dung thành công',
      contentDeleted: 'Xóa nội dung thành công',
      fileUploadError: 'Lỗi tải lên tệp',
      fileSizeExceeded: 'Kích thước tệp vượt quá giới hạn',
      fileTypeNotAllowed: 'Loại tệp không được phép',
      contentDistributed: 'Phân phối nội dung thành công',
      cacheInvalidated: 'Xóa cache thành công'
    },
    // System messages
    system: {
      serverError: 'Lỗi máy chủ nội bộ',
      databaseError: 'Lỗi cơ sở dữ liệu',
      networkError: 'Lỗi mạng',
      permissionDenied: 'Quyền truy cập bị từ chối',
      resourceNotFound: 'Không tìm thấy tài nguyên',
      invalidRequest: 'Yêu cầu không hợp lệ',
      operationFailed: 'Thao tác thất bại',
      operationSuccess: 'Thao tác hoàn thành thành công'
    }
  }
};

// Get message by language and key
const getMessage = (language, category, key) => {
  const lang = messages[language] || messages.en;
  const categoryMessages = lang[category] || {};
  return categoryMessages[key] || key;
};

// Get validation message
const getValidationMessage = (language, key) => {
  return getMessage(language, 'validation', key);
};

// Get authentication message
const getAuthMessage = (language, key) => {
  return getMessage(language, 'auth', key);
};

// Get node management message
const getNodeMessage = (language, key) => {
  return getMessage(language, 'nodes', key);
};

// Get alert message
const getAlertMessage = (language, key) => {
  return getMessage(language, 'alerts', key);
};

// Get content management message
const getContentMessage = (language, key) => {
  return getMessage(language, 'content', key);
};

// Get system message
const getSystemMessage = (language, key) => {
  return getMessage(language, 'system', key);
};

module.exports = {
  messages,
  getMessage,
  getValidationMessage,
  getAuthMessage,
  getNodeMessage,
  getAlertMessage,
  getContentMessage,
  getSystemMessage
}; 