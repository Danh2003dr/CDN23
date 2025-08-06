const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { getAuthMessage, getValidationMessage } = require('../config/languages');

class AuthController {
    static async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { email, password } = req.body;
            
            // Tìm user theo email
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: getAuthMessage('vi', 'invalidCredentials')
                });
            }
            
            // Kiểm tra password
            const isValidPassword = await User.validatePassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: getAuthMessage('vi', 'invalidCredentials')
                });
            }
            
            // Kiểm tra user có active không
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: getAuthMessage('vi', 'userInactive')
                });
            }
            
            // Tạo JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email,
                    role: user.role_name 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );
            
            // Cập nhật last_login
            await User.updateLastLogin(user.id);
            
            // Trả về response (không bao gồm password_hash)
            const { password_hash, ...userResponse } = user;
            
            res.json({
                success: true,
                message: getAuthMessage('vi', 'loginSuccess'),
                data: {
                    user: userResponse,
                    token
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { username, email, password, first_name, last_name, role_id } = req.body;
            
            // Kiểm tra email đã tồn tại
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: getAuthMessage('vi', 'emailAlreadyExists')
                });
            }
            
            // Tạo user mới
            const userData = {
                username,
                email,
                password,
                first_name,
                last_name,
                role_id: role_id || 3 // Default to viewer role
            };
            
            const newUser = await User.create(userData);
            
            res.status(201).json({
                success: true,
                message: getAuthMessage('vi', 'registrationSuccess'),
                data: newUser
            });
            
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async profile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            const { password_hash, ...userResponse } = user;
            
            res.json({
                success: true,
                data: userResponse
            });
            
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { first_name, last_name, email } = req.body;
            
            // Kiểm tra email đã tồn tại (nếu thay đổi email)
            if (email && email !== req.user.email) {
                const existingUser = await User.findByEmail(email);
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already exists'
                    });
                }
            }
            
            const updateData = {
                first_name,
                last_name,
                email
            };
            
            const updatedUser = await User.update(req.user.id, updateData);
            
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser
            });
            
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async changePassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { currentPassword, newPassword } = req.body;
            
            // Lấy user với password hash
            const user = await User.findById(req.user.id);
            
            // Kiểm tra current password
            const isValidPassword = await User.validatePassword(currentPassword, user.password_hash);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            
            // Cập nhật password mới
            await User.updatePassword(req.user.id, newPassword);
            
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
            
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async logout(req, res) {
        try {
            // Trong thực tế, có thể blacklist token
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async refreshToken(req, res) {
        try {
            // Tạo token mới
            const token = jwt.sign(
                { 
                    userId: req.user.id, 
                    email: req.user.email,
                    role: req.user.role_name 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );
            
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: { token }
            });
            
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Admin functions - User Management
    static async createUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { username, email, password, first_name, last_name, role_id } = req.body;
            
            // Kiểm tra email đã tồn tại
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            
            // Kiểm tra username đã tồn tại
            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
            
            // Tạo user mới
            const newUser = await User.create({
                username,
                email,
                password,
                first_name,
                last_name,
                role_id: role_id || 5 // Default to viewer role
            });
            
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    role_id: newUser.role_id,
                    is_active: newUser.is_active,
                    created_at: newUser.created_at
                }
            });
            
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getAllUsers(req, res) {
        try {
            const users = await User.findAll();
            
            res.json({
                success: true,
                data: users
            });
            
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.json({
                success: true,
                data: user
            });
            
        } catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async updateUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { id } = req.params;
            const { username, email, first_name, last_name, role_id, is_active } = req.body;
            
            // Kiểm tra user tồn tại
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Kiểm tra email đã tồn tại (nếu thay đổi email)
            if (email && email !== existingUser.email) {
                const emailExists = await User.findByEmail(email);
                if (emailExists && emailExists.id !== parseInt(id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already exists'
                    });
                }
            }
            
            const updateData = {
                username,
                email,
                first_name,
                last_name,
                role_id,
                is_active
            };
            
            const updatedUser = await User.update(id, updateData);
            
            res.json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });
            
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            
            // Không cho phép xóa chính mình
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }
            
            // Kiểm tra user tồn tại
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            await User.delete(id);
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
            
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async activateUser(req, res) {
        try {
            const { id } = req.params;
            
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            await User.update(id, { is_active: true });
            
            res.json({
                success: true,
                message: 'User activated successfully'
            });
            
        } catch (error) {
            console.error('Activate user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async deactivateUser(req, res) {
        try {
            const { id } = req.params;
            
            // Không cho phép deactivate chính mình
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate your own account'
                });
            }
            
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            await User.update(id, { is_active: false });
            
            res.json({
                success: true,
                message: 'User deactivated successfully'
            });
            
        } catch (error) {
            console.error('Deactivate user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getRoles(req, res) {
        try {
            const roles = await User.getAllRoles();
            
            res.json({
                success: true,
                data: roles
            });
            
        } catch (error) {
            console.error('Get roles error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = AuthController; 