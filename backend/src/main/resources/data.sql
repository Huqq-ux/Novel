-- 插入用户数据
INSERT INTO users (username, password, email, avatar, gender, age, register_time, last_login_time, status) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', '男', 28, NOW(), NOW(), 1),
('testuser', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'test@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser', '女', 25, NOW(), NOW(), 1),
('xiaoming', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'xiaoming@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming', '男', 30, NOW(), NOW(), 1),
('xiaohong', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'xiaohong@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong', '女', 22, NOW(), NOW(), 1),
('zhangsan', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'zhangsan@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', '男', 35, NOW(), NOW(), 1);

-- 插入书籍数据
INSERT INTO books (title, author, cover, category, description, chapter_count, is_finished, rating, click_count, collect_count, create_time, update_time, latest_chapter_name, latest_chapter_update_time) VALUES
('Spring Boot实战', '张三', 'https://placehold.co/200x280/0ea5e9/fff?text=Spring', '技术', '一本深入浅出介绍Spring Boot开发的书籍，涵盖实际项目开发技巧和最佳实践。', 50, TRUE, 4.5, 12580, 3420, NOW(), NOW(), '第五十章 总结与展望', NOW()),
('Vue.js从入门到精通', '李四', 'https://placehold.co/200x280/10b981/fff?text=Vue', '技术', '全面介绍Vue.js框架的使用方法，包含最新特性和实战案例。', 45, TRUE, 4.7, 15230, 4560, NOW(), NOW(), '第四十五章 项目实战', NOW()),
('红楼梦', '曹雪芹', 'https://placehold.co/200x280/f59e0b/fff?text=红楼梦', '文学', '中国古代四大名著之一，描绘了贾史王薛四大家族的兴衰史。', 120, TRUE, 4.9, 45680, 12340, NOW(), NOW(), '第一百二十回 续书', NOW()),
('三体', '刘慈欣', 'https://placehold.co/200x280/06b6d4/fff?text=三体', '科幻', '一部优秀的科幻小说，讲述了地球人类文明和三体文明的信息交流、生死搏杀及两个文明在宇宙中的兴衰历程。', 80, TRUE, 4.8, 38920, 9870, NOW(), NOW(), '第八十章 宇宙的终结', NOW()),
('活着', '余华', 'https://placehold.co/200x280/d97706/fff?text=活着', '文学', '通过主人公福贵的人生经历，展现了中国社会变迁和普通人的命运。', 30, TRUE, 4.6, 23450, 6780, NOW(), NOW(), '第三十章 尾声', NOW()),
('Java编程思想', 'Bruce Eckel', 'https://placehold.co/200x280/3b82f6/fff?text=Java', '技术', 'Java编程领域的经典著作，深入讲解Java语言的核心概念和编程技巧。', 60, TRUE, 4.8, 18920, 5230, NOW(), NOW(), '第六十章 附录', NOW()),
('Python深度学习', 'Francois Chollet', 'https://placehold.co/200x280/6366f1/fff?text=Python', '技术', '详细介绍使用Python进行深度学习的方法和实践。', 40, TRUE, 4.6, 14560, 3890, NOW(), NOW(), '第四十章 实战项目', NOW()),
('西游记', '吴承恩', 'https://placehold.co/200x280/8b5cf6/fff?text=西游记', '文学', '中国古代四大名著之一，讲述了唐僧师徒四人西天取经的故事。', 100, TRUE, 4.8, 34560, 9230, NOW(), NOW(), '第一百回 取经归来', NOW()),
('水浒传', '施耐庵', 'https://placehold.co/200x280/ec4899/fff?text=水浒传', '文学', '中国古代四大名著之一，讲述了梁山好汉起义的故事。', 120, TRUE, 4.7, 29870, 8120, NOW(), NOW(), '第一百二十回 招安', NOW()),
('三国演义', '罗贯中', 'https://placehold.co/200x280/ef4444/fff?text=三国', '文学', '中国古代四大名著之一，讲述了东汉末年到西晋初年的历史风云。', 120, TRUE, 4.9, 42340, 11560, NOW(), NOW(), '第一百二十回 三分归晋', NOW());

-- 插入章节数据
INSERT INTO chapters (book_id, title, content, order_num, word_count, create_time, update_time) VALUES
(1, '第一章 Spring Boot简介', 'Spring Boot是由Pivotal团队提供的全新框架，其设计目的是用来简化新Spring应用的初始搭建以及开发过程。该框架使用了特定的方式来进行配置，从而使开发人员不再需要定义样板化的配置。', 1, 2000, NOW(), NOW()),
(1, '第二章 快速入门', '本章将带你快速了解Spring Boot的基本使用方法，包括项目创建、配置文件、自动配置等核心概念。', 2, 2500, NOW(), NOW()),
(1, '第三章 Web开发', 'Spring Boot为Web开发提供了强大的支持，本章将介绍如何使用Spring MVC构建RESTful API。', 3, 3000, NOW(), NOW()),
(2, '第一章 Vue.js基础', 'Vue.js是一套用于构建用户界面的渐进式框架，与其它大型框架不同的是，Vue被设计为可以自底向上逐层应用。', 1, 2200, NOW(), NOW()),
(2, '第二章 组件化开发', '组件系统是Vue的另一个重要概念，因为它是一种抽象，允许我们使用小型、独立和通常可复用的组件构建大型应用。', 2, 2800, NOW(), NOW()),
(3, '第一回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀', '此开卷第一回也。作者自云：曾历过一番梦幻之后，故将真事隐去，而借通灵之说，撰此《石头记》一书也。', 1, 3500, NOW(), NOW()),
(3, '第二回 贾夫人仙逝扬州城 冷子兴演说荣国府', '话说封肃因听见公差传唤，忙出来陪笑启问。', 2, 3200, NOW(), NOW()),
(4, '第一章 科学边界', '叶文洁看着眼前的红岸基地，心中涌起复杂的情感。', 1, 2800, NOW(), NOW()),
(4, '第二章 三体', '汪淼进入了三体游戏，开始了解这个神秘的世界。', 2, 3000, NOW(), NOW()),
(5, '第一章', '我比现在年轻十岁的时候，获得了一个游手好闲的职业，去乡间收集民间歌谣。', 1, 2500, NOW(), NOW());
