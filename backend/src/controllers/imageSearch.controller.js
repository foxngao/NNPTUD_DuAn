const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ==================== MULTER CONFIG ====================

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Warning: Could not create uploads directory:', err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'search-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ==================== CONTROLLERS ====================

// POST /api/v1/search/image - Tìm kiếm bằng hình ảnh
const searchByImage = async (req, res) => {
  try {
    let { description = '', category_id } = req.body;
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 12;
    const offset = (page - 1) * limit;

    // Kiểm tra có file upload hoặc description
    if (!req.file && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload ảnh hoặc nhập mô tả phụ tùng cần tìm.'
      });
    }

    let imageUrl = null;
    let aiKeywords = '';
    let matchedProductIds = [];

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      // Gọi Google Gemini API để nhận diện phụ tùng
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

          const imageParts = [
            {
              inlineData: {
                data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64"),
                mimeType: req.file.mimetype
              }
            }
          ];

          // Lấy nhanh danh sách ID và Tên sản phẩm hiện có
          const [allParts] = await db.query('SELECT id, name FROM parts');
          let partsListText = allParts.map(p => `ID: ${p.id} - ${p.name}`).join('\n');

          // Đề phòng danh sách quá dài gây lỗi API, giới hạn số lượng ký tự (~ 500 parts)
          if (partsListText.length > 25000) {
            partsListText = partsListText.substring(0, 25000) + '\n...';
          }

          const prompt = `Bạn là một chuyên gia về phụ tùng ô tô. 
Nhiệm vụ 1: Nhận dạng phụ tùng ô tô trong ảnh và trả về một vài từ khóa ngắn gọn, cách nhau bằng dấu phẩy.
Nhiệm vụ 2: Dựa vào hình ảnh, hãy tìm trong danh sách các sản phẩm đang có sẵn dưới đây xem có sản phẩm nào CÙNG LOẠI HOẶC CHÍNH XÁC là sản phẩm trong ảnh không.
Danh sách sản phẩm:
${partsListText}

Luôn trả về kết quả dưới dạng JSON (không dùng block \`\`\`json) theo đúng định dạng sau:
{"keywords": "từ khóa 1, từ khóa 2", "matched_ids": [id1, id2]}`;

          const result = await model.generateContent([prompt, ...imageParts]);
          const responseText = await result.response.text();

          try {
            // Cố gắng parse JSON từ chuỗi kết quả
            const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(cleanJsonText);

            aiKeywords = aiData.keywords || '';
            if (Array.isArray(aiData.matched_ids)) {
              matchedProductIds = aiData.matched_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
            }
          } catch (parseError) {
            console.error('Failed to parse Gemini JSON output:', parseError);
            console.log('Raw output was:', responseText);
            // Fallback nếu không parse được JSON
            aiKeywords = responseText.trim().replace(/[.,\n]/g, ' ');
          }

          console.log('AI detected keywords:', aiKeywords);
          console.log('AI matched IDs:', matchedProductIds);

          // Gộp từ khóa AI nhận diện được vào mô tả của user
          description = `${description} ${aiKeywords}`.trim();
        } catch (aiError) {
          console.error('Gemini AI Error:', aiError.message);
        }
      }
    }

    // Tìm kiếm dựa trên description (keyword matching) và original image name
    let searchConditions = [];
    let whereParams = [];
    let relevanceCases = [];
    let scoreParams = [];

    // 1. Image name matching (high priority)
    let originalNameBase = '';
    let nameKeywords = [];
    if (req.file && req.file.originalname) {
      originalNameBase = path.parse(req.file.originalname).name;
      // Tách tên file thành các từ khóa (loại bỏ số, dấu gạch ngang, gạch dưới)
      nameKeywords = originalNameBase.split(/[-_\s]+/).filter(k => k.length >= 3);

      console.log('Original image name:', originalNameBase);
      console.log('Image name keywords:', nameKeywords);

      if (nameKeywords.length > 0) {
        nameKeywords.forEach(kw => {
          searchConditions.push('(p.image_url LIKE ?)');
          whereParams.push(`%${kw}%`);

          relevanceCases.push('(CASE WHEN p.image_url LIKE ? THEN 50 ELSE 0 END)');
          scoreParams.push(`%${kw}%`);
        });
      } else if (originalNameBase.length >= 3) {
        searchConditions.push('(p.image_url LIKE ?)');
        whereParams.push(`%${originalNameBase}%`);

        relevanceCases.push('(CASE WHEN p.image_url LIKE ? THEN 100 ELSE 0 END)');
        scoreParams.push(`%${originalNameBase}%`);
      }
    }

    // 2. AI keywords matching
    if (description.trim()) {
      const cleanDesc = description.replace(/[.,;:]/g, ' ');
      const keywords = cleanDesc.trim().split(/\s+/).filter(k => k.length >= 2);

      if (keywords.length > 0) {
        keywords.forEach(() => {
          searchConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
        });

        keywords.forEach(kw => {
          whereParams.push(`%${kw}%`, `%${kw}%`);

          relevanceCases.push('(CASE WHEN p.name LIKE ? THEN 2 ELSE 0 END) + (CASE WHEN p.description LIKE ? THEN 1 ELSE 0 END)');
          scoreParams.push(`%${kw}%`, `%${kw}%`);
        });
      }
    }

    // 3. AI Exact Matched IDs
    if (matchedProductIds.length > 0) {
      // Create a condition for matching the ID
      const idPlaceholders = matchedProductIds.map(() => '?').join(',');

      // Nếu có ID khớp chính xác, TẮT việc tìm kiếm bằng keyword để loại bỏ các sản phẩm không liên quan
      searchConditions = [`(p.id IN (${idPlaceholders}))`];
      whereParams = [...matchedProductIds];

      relevanceCases = [`(CASE WHEN p.id IN (${idPlaceholders}) THEN 1000 ELSE 0 END)`];
      scoreParams = [...matchedProductIds];
    }

    // Nếu cả ảnh lẫn AI đều ko lấy được thông tin gì 
    if (searchConditions.length === 0) {
      return res.json({
        success: true,
        data: {
          uploaded_image: imageUrl,
          description: description.trim(),
          parts: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      });
    }

    let finalWhere = [];
    let finalWhereParams = [];

    // Gom nhóm tất cả keyword/image name vào 1 khối OR
    finalWhere.push(`(${searchConditions.join(' OR ')})`);
    finalWhereParams.push(...whereParams);

    // Lọc theo danh mục bộ lọc (phải là AND)
    if (category_id) {
      finalWhere.push('p.category_id = ?');
      finalWhereParams.push(category_id);
    }

    const finalWhereClause = `WHERE ${finalWhere.join(' AND ')}`;

    const relevanceSelect = relevanceCases.length > 0
      ? `(${relevanceCases.join(' + ')}) as relevance_score`
      : '0 as relevance_score';

    // Count
    let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM parts p ${finalWhereClause}`;
    let countParams = [...finalWhereParams];

    // Nếu có tính điểm relevance, ta dùng HAVING để loại bỏ các kết quả quá ít liên quan (điểm = 0)
    const havingClause = relevanceCases.length > 0 ? `HAVING relevance_score > 0` : '';

    if (havingClause) {
      // Để dùng HAVING với COUNT, ta phải bọc vào subquery
      countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT p.id, ${relevanceSelect}
          FROM parts p
          ${finalWhereClause}
          ${havingClause}
        ) as subquery
      `;
      // Score params need to be before finalWhereParams in the subquery
      countParams = [...scoreParams, ...finalWhereParams, ...scoreParams];
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Lấy parts
    console.log('Final Where Clause:', finalWhereClause);
    console.log('Final Where Params:', finalWhereParams);
    console.log('Relevance Select:', relevanceSelect);
    console.log('Score Params:', scoreParams);

    const [parts] = await db.query(
      `SELECT DISTINCT p.*, c.name as category_name, ${relevanceSelect}
       FROM parts p
       JOIN categories c ON p.category_id = c.id
       ${finalWhereClause}
       ${havingClause}
       ORDER BY relevance_score DESC, p.name ASC
       LIMIT ? OFFSET ?`,
      [...scoreParams, ...finalWhereParams, limit, offset]
    );

    console.log('Top parts returned:', parts.slice(0, 3).map(p => ({ id: p.id, name: p.name, score: p.relevance_score, image: p.image_url })));

    return res.json({
      success: true,
      data: {
        uploaded_image: imageUrl,
        description: description.trim(),
        parts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { upload, searchByImage };
