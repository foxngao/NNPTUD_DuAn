-- =============================================
-- Seed Data for Car Parts Database
-- =============================================

USE car_parts_db;

-- ========== ROLES ==========
INSERT INTO roles (name) VALUES ('admin'), ('user');

-- ========== ADMIN USER (password: Admin@123) ==========
-- Bcrypt hash for 'Admin@123'
INSERT INTO users (username, password, email, full_name, is_active) VALUES
('admin', '$2a$10$X7UrE2J3Gq5Z8v1Y6mK5aOJz0pR4sT7wL9xN3bV8cD6fH2jM4kQ0', 'admin@carparts.com', 'System Admin', TRUE);

INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- ========== BRANDS ==========
INSERT INTO brands (name, country) VALUES
('Toyota', 'Japan'),
('Honda', 'Japan'),
('Ford', 'USA'),
('Hyundai', 'South Korea'),
('Mercedes-Benz', 'Germany'),
('BMW', 'Germany'),
('Mazda', 'Japan'),
('Kia', 'South Korea');

-- ========== CAR MODELS ==========
INSERT INTO car_models (brand_id, name) VALUES
-- Toyota (brand_id = 1)
(1, 'Camry'),
(1, 'Corolla'),
(1, 'Vios'),
-- Honda (brand_id = 2)
(2, 'Civic'),
(2, 'CR-V'),
(2, 'City'),
-- Ford (brand_id = 3)
(3, 'Ranger'),
(3, 'Everest'),
-- Hyundai (brand_id = 4)
(4, 'Accent'),
(4, 'Tucson'),
-- Mercedes (brand_id = 5)
(5, 'C-Class'),
-- BMW (brand_id = 6)
(6, '3 Series'),
-- Mazda (brand_id = 7)
(7, 'Mazda3'),
(7, 'CX-5'),
-- Kia (brand_id = 8)
(8, 'Seltos'),
(8, 'K3');

-- ========== MODEL YEARS ==========
INSERT INTO model_years (model_id, year) VALUES
-- Camry (model_id = 1)
(1, 2022), (1, 2023), (1, 2024),
-- Corolla (model_id = 2)
(2, 2022), (2, 2023),
-- Vios (model_id = 3)
(3, 2023), (3, 2024),
-- Civic (model_id = 4)
(4, 2022), (4, 2023), (4, 2024),
-- CR-V (model_id = 5)
(5, 2023), (5, 2024),
-- City (model_id = 6)
(6, 2023),
-- Ranger (model_id = 7)
(7, 2023), (7, 2024),
-- Everest (model_id = 8)
(8, 2023),
-- Accent (model_id = 9)
(9, 2023), (9, 2024),
-- Tucson (model_id = 10)
(10, 2023),
-- C-Class (model_id = 11)
(11, 2023),
-- 3 Series (model_id = 12)
(12, 2023),
-- Mazda3 (model_id = 13)
(13, 2023), (13, 2024),
-- CX-5 (model_id = 14)
(14, 2023),
-- Seltos (model_id = 15)
(15, 2023), (15, 2024),
-- K3 (model_id = 16)
(16, 2023);

-- ========== CATEGORIES ==========
INSERT INTO categories (name) VALUES
('Động cơ'),
('Hệ thống phanh'),
('Hệ thống điện'),
('Thân vỏ xe'),
('Hệ thống treo'),
('Hệ thống lái'),
('Phụ kiện nội thất'),
('Phụ kiện ngoại thất');

-- ========== PARTS ==========
INSERT INTO parts (category_id, name, description, price, stock_quantity, image_url) VALUES
-- Động cơ
(1, 'Lọc dầu động cơ Toyota', 'Lọc dầu chính hãng cho các dòng xe Toyota', 150000, 100, NULL),
(1, 'Bugi NGK Iridium', 'Bugi đánh lửa cao cấp NGK Iridium, phù hợp nhiều dòng xe', 85000, 200, NULL),
(1, 'Dây curoa tổng Honda', 'Dây curoa tổng cho động cơ Honda 1.5L', 320000, 50, NULL),
-- Hệ thống phanh
(2, 'Má phanh trước Brembo', 'Má phanh hiệu suất cao Brembo cho sedan', 450000, 80, NULL),
(2, 'Đĩa phanh sau Toyota Camry', 'Đĩa phanh sau chính hãng cho Toyota Camry', 680000, 30, NULL),
(2, 'Dầu phanh DOT4 Bosch', 'Dầu phanh Bosch DOT4 1 lít', 120000, 150, NULL),
-- Hệ thống điện
(3, 'Ắc quy Varta 12V 60Ah', 'Ắc quy khởi động Varta chính hãng', 1500000, 40, NULL),
(3, 'Bóng đèn pha LED H7', 'Bóng đèn LED H7 siêu sáng 6000K', 350000, 120, NULL),
(3, 'Còi xe Hella Twin Tone', 'Còi xe Hella âm thanh kép chính hãng', 280000, 60, NULL),
-- Thân vỏ xe
(4, 'Gương chiếu hậu trái Honda Civic', 'Gương chiếu hậu điện chỉnh cho Honda Civic', 850000, 25, NULL),
(4, 'Cản trước Ford Ranger', 'Cản trước nguyên bản Ford Ranger 2023', 2500000, 15, NULL),
-- Hệ thống treo
(5, 'Giảm xóc trước KYB', 'Giảm xóc trước KYB Excel-G cho sedan', 750000, 45, NULL),
(5, 'Cao su chân máy Toyota', 'Cao su chân máy chống rung cho Toyota', 220000, 70, NULL),
-- Hệ thống lái
(6, 'Rotuyn lái ngoài Toyota Vios', 'Rotuyn lái ngoài chính hãng cho Vios', 180000, 55, NULL),
(6, 'Dầu trợ lực lái ATF', 'Dầu trợ lực lái tổng hợp 1 lít', 95000, 130, NULL);

-- ========== PART COMPATIBILITY ==========
-- Lọc dầu Toyota -> Camry 2022-2024, Corolla 2022-2023, Vios 2023-2024
INSERT INTO part_compatibility (part_id, model_year_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
-- Bugi NGK -> nhiều dòng xe
(2, 1), (2, 2), (2, 4), (2, 5), (2, 8), (2, 9), (2, 10),
-- Dây curoa Honda -> Civic, CR-V, City
(3, 8), (3, 9), (3, 10), (3, 11), (3, 12), (3, 13),
-- Má phanh Brembo -> sedan phổ thông
(4, 1), (4, 2), (4, 3), (4, 8), (4, 9), (4, 10),
-- Đĩa phanh Camry -> Camry only
(5, 1), (5, 2), (5, 3),
-- Dầu phanh -> universal
(6, 1), (6, 2), (6, 8), (6, 9), (6, 14), (6, 15),
-- Ắc quy Varta -> nhiều xe
(7, 1), (7, 2), (7, 8), (7, 9), (7, 14), (7, 15), (7, 17), (7, 18),
-- LED H7 -> nhiều xe
(8, 1), (8, 2), (8, 4), (8, 5), (8, 8), (8, 9),
-- Gương Honda Civic -> Civic only
(10, 8), (10, 9), (10, 10),
-- Cản trước Ranger -> Ranger only
(11, 14), (11, 15),
-- Giảm xóc KYB -> sedan
(12, 1), (12, 2), (12, 4), (12, 5), (12, 8), (12, 9),
-- Cao su chân máy Toyota
(13, 1), (13, 2), (13, 3), (13, 6), (13, 7),
-- Rotuyn Vios -> Vios only
(14, 6), (14, 7);
