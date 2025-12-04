-- ============================================
-- DRL Platform - Shared Database Migrations
-- Version: V1
-- Description: Creates authentication and authorization tables
-- Date: 2025-12-01
-- ============================================

-- Table: roles (natural key: name)
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'User roles (STUDENT, INSTRUCTOR, ADMIN, etc.)';

-- Table: permissions (natural key: name)
CREATE TABLE IF NOT EXISTS permissions (
    name VARCHAR(100) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE permissions IS 'System permissions for RBAC';

-- Table: users (surrogate key: id)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    student_code VARCHAR(20), -- Reference to student in student-service (no FK)
    class_code VARCHAR(20), -- Class code from student record (cached for quick access)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'System users for authentication';
COMMENT ON COLUMN users.student_code IS 'Reference to student in student-service (no FK - microservice independence)';
COMMENT ON COLUMN users.class_code IS 'Cached class code from student-service for quick access';

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_student_code ON users(student_code);
CREATE INDEX IF NOT EXISTS idx_users_class_code ON users(class_code);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Table: user_roles (composite key: user_id, role_name)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role_name),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_name) REFERENCES roles(name) ON DELETE CASCADE
);

COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles';

-- Table: role_permissions (composite key: role_name, permission_name)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_name VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_name, permission_name),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_name) REFERENCES roles(name) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_name) REFERENCES permissions(name) ON DELETE CASCADE
);

COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between roles and permissions';

-- Indexes for join tables
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_name);

