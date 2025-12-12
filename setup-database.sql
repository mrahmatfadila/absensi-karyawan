-- Database: attendance_system
CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- Table: roles
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name) VALUES 
('admin'), 
('manager'), 
('employee');

-- Table: departments
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name, description) VALUES 
('HR & GA', 'Human Resources & General Affairs'),
('IT', 'Information Technology'),
('Finance', 'Finance and Accounting'),
('Marketing', 'Marketing and Sales'),
('Operations', 'Operations and Production'),
('Sales', 'Sales and Business Development');

-- Table: users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department_id INT,
    position VARCHAR(100),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Insert sample users (password: admin123)
INSERT INTO users (employee_id, name, email, password, role_id, department_id, position, hire_date) 
VALUES 
('ADM001', 'Admin User', 'admin@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeZHn9K0cZ2lEfzYjq3JwqK7Q9Vj5lXW2', 1, 1, 'System Administrator', '2023-01-01'),
('MGR001', 'Manager One', 'manager@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeZHn9K0cZ2lEfzYjq3JwqK7Q9Vj5lXW2', 2, 2, 'IT Manager', '2023-02-01'),
('EMP001', 'Employee One', 'employee@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeZHn9K0cZ2lEfzYjq3JwqK7Q9Vj5lXW2', 3, 2, 'Software Developer', '2023-03-01'),
('EMP002', 'John Doe', 'john@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeZHn9K0cZ2lEfzYjq3JwqK7Q9Vj5lXW2', 3, 3, 'Accountant', '2023-04-01'),
('EMP003', 'Jane Smith', 'jane@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeZHn9K0cZ2lEfzYjq3JwqK7Q9Vj5lXW2', 3, 4, 'Marketing Specialist', '2023-05-01');

-- Table: attendance
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    check_in DATETIME,
    check_out DATETIME,
    status ENUM('present', 'late', 'absent', 'leave') DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample attendance records
INSERT INTO attendance (user_id, check_in, check_out, status, notes) VALUES
(3, '2024-01-15 08:00:00', '2024-01-15 17:00:00', 'present', 'Work day'),
(3, '2024-01-16 08:15:00', '2024-01-16 17:30:00', 'present', 'Overtime 30 minutes'),
(3, '2024-01-17 09:05:00', '2024-01-17 17:15:00', 'late', 'Traffic jam'),
(4, '2024-01-15 08:30:00', '2024-01-15 16:45:00', 'present', 'Early leave'),
(4, '2024-01-16 08:00:00', '2024-01-16 17:00:00', 'present', 'Regular day'),
(5, '2024-01-15 08:45:00', '2024-01-15 17:15:00', 'present', 'Client meeting');

-- Table: leave_requests
CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    leave_type ENUM('sick', 'annual', 'personal', 'other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert sample leave requests
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status) VALUES
(3, 'annual', '2024-01-20', '2024-01-22', 'Family vacation', 'approved'),
(4, 'sick', '2024-01-18', '2024-01-18', 'Flu', 'approved'),
(5, 'personal', '2024-01-25', '2024-01-26', 'Personal matters', 'pending');

-- Create indexes for better performance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_check_in ON attendance(check_in);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);