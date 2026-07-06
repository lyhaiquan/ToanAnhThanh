import { prisma } from '../../db.js';
import type { AIProvider, ChatMessage, Exercise, LectureAnalysis, Slide } from './provider.js';

/**
 * MockAIProvider — dữ liệu toán mẫu theo chủ đề, nhận diện qua tiêu đề bài học.
 * Cho phép demo đầy đủ luồng AI mà không cần LLM API key.
 */

type Topic = {
  match: RegExp;
  analysis: LectureAnalysis;
  exercises: Exercise[];
  slides: Slide[];
  faq: { match: RegExp; answer: string }[];
};

const TOPICS: Topic[] = [
  {
    match: /đồng biến|nghịch biến|đơn điệu/i,
    analysis: {
      summary:
        'Bài giảng trình bày mối liên hệ giữa dấu của đạo hàm và tính đơn điệu của hàm số: nếu f\'(x) > 0 trên khoảng K thì f đồng biến trên K, nếu f\'(x) < 0 thì nghịch biến. Quy tắc xét: tìm tập xác định → tính f\'(x) → lập bảng xét dấu → kết luận theo từng khoảng.',
      concepts: ['Đạo hàm và dấu của đạo hàm', 'Hàm số đồng biến / nghịch biến', 'Bảng biến thiên', 'Điều kiện đủ của tính đơn điệu'],
      objectives: ['Xét được tính đơn điệu của hàm đa thức, phân thức', 'Lập bảng biến thiên thành thạo', 'Tránh lỗi kết luận "đồng biến trên hợp hai khoảng"'],
    },
    exercises: [
      { question: 'Xét tính đơn điệu của hàm số y = x³ − 6x² + 9x + 1.', hint: "Tính y' = 3x² − 12x + 9, giải y' = 0.", solution: "y' = 3(x−1)(x−3). Hàm đồng biến trên (−∞;1) và (3;+∞), nghịch biến trên (1;3)." },
      { question: 'Tìm m để hàm số y = x³ + 3x² + mx + 2 đồng biến trên ℝ.', hint: "Cần y' ≥ 0 với mọi x, tức Δ' ≤ 0.", solution: "y' = 3x² + 6x + m ≥ 0 ∀x ⇔ Δ' = 9 − 3m ≤ 0 ⇔ m ≥ 3." },
      { question: 'Chứng minh hàm số y = (2x + 1)/(x + 1) đồng biến trên từng khoảng xác định.', hint: 'Tính đạo hàm bằng công thức (ax+b)/(cx+d).', solution: "y' = 1/(x+1)² > 0 với mọi x ≠ −1 → đồng biến trên (−∞;−1) và (−1;+∞)." },
    ],
    slides: [
      { title: 'Sự đồng biến, nghịch biến của hàm số', bullets: ['Liên hệ dấu đạo hàm ↔ chiều biến thiên', 'Mục tiêu: thành thạo bảng biến thiên'] },
      { title: 'Định lý cơ bản', bullets: ["f'(x) > 0 trên K → f đồng biến trên K", "f'(x) < 0 trên K → f nghịch biến trên K", 'Dấu bằng tại hữu hạn điểm vẫn kết luận được'] },
      { title: 'Quy tắc xét tính đơn điệu', bullets: ['B1: Tìm tập xác định', "B2: Tính f'(x), tìm nghiệm", 'B3: Lập bảng xét dấu', 'B4: Kết luận theo từng khoảng'] },
      { title: 'Ví dụ điển hình', bullets: ['y = x³ − 3x: đồng biến (−∞;−1)∪(1;+∞)... — cẩn thận: phải nói "trên từng khoảng"', 'Hàm phân thức bậc nhất: dấu y\' không đổi'] },
      { title: 'Lỗi thường gặp', bullets: ['Không được viết "đồng biến trên (−∞;−1) ∪ (1;+∞)"', 'Quên loại điểm không xác định', 'Nhầm điều kiện cần với điều kiện đủ'] },
    ],
    faq: [
      { match: /vì sao|tại sao.*(hợp|∪|union)/i, answer: 'Vì tính đơn điệu định nghĩa trên MỘT khoảng: lấy x₁ < x₂ trong cùng khoảng. Nếu x₁ ∈ (−∞;−1) và x₂ ∈ (1;+∞) thì không so sánh được f(x₁), f(x₂) bằng định lý — ví dụ y = x³ − 3x có f(−1) = 2 > f(1) = −2 dù cả hai khoảng đều "đồng biến".' },
      { match: /bảng biến thiên/i, answer: 'Bảng biến thiên gồm 3 dòng: x (các điểm tới hạn + biên), dấu f\'(x), chiều mũi tên của f(x). Mẹo: điền dấu của f\' trước bằng cách thử 1 giá trị trong mỗi khoảng.' },
      { match: /m để.*đồng biến|tham số/i, answer: 'Dạng "tìm m để hàm đồng biến trên ℝ": với hàm bậc 3 có a > 0, cần y\' ≥ 0 ∀x ⇔ Δ của y\' ≤ 0. Nếu đồng biến trên khoảng con, dùng cô lập tham số m ≥ g(x) rồi tìm max/min của g.' },
    ],
  },
  {
    match: /cực trị|cực đại|cực tiểu/i,
    analysis: {
      summary:
        'Bài giảng định nghĩa điểm cực đại/cực tiểu và hai quy tắc tìm cực trị: Quy tắc 1 dùng bảng xét dấu f\'(x) (f\' đổi dấu qua x₀), Quy tắc 2 dùng f\'\'(x₀) (f\'(x₀)=0 và f\'\'(x₀)≠0).',
      concepts: ['Điểm cực trị, giá trị cực trị', "Quy tắc 1 (xét dấu f')", "Quy tắc 2 (dấu f'')", 'Cực trị hàm bậc 3, bậc 4 trùng phương'],
      objectives: ['Tìm cực trị bằng cả 2 quy tắc', 'Phân biệt giá trị cực trị và điểm cực trị', 'Giải bài toán tham số về cực trị'],
    },
    exercises: [
      { question: 'Tìm cực trị của hàm số y = x³ − 3x² − 9x + 5.', hint: "y' = 3x² − 6x − 9 = 3(x+1)(x−3).", solution: 'Cực đại tại x = −1, y_CĐ = 10; cực tiểu tại x = 3, y_CT = −22.' },
      { question: 'Tìm m để y = x³ − 3mx² + 3(m² − 1)x có cực đại và cực tiểu.', hint: "y' là tam thức bậc hai, cần 2 nghiệm phân biệt.", solution: "y' = 3[x² − 2mx + m² − 1]; Δ' = m² − (m² − 1) = 1 > 0 ∀m → luôn có 2 cực trị với mọi m." },
      { question: 'Hàm y = x⁴ − 2mx² + 1 có 3 điểm cực trị khi nào?', hint: "y' = 4x(x² − m).", solution: 'Cần x² = m có 2 nghiệm khác 0, tức m > 0.' },
    ],
    slides: [
      { title: 'Cực trị của hàm số', bullets: ['Điểm cực đại / cực tiểu là cực trị ĐỊA PHƯƠNG', 'Không nhầm với GTLN/GTNN toàn cục'] },
      { title: 'Quy tắc 1', bullets: ["Lập bảng xét dấu f'", "f' đổi dấu + → −: cực đại", "f' đổi dấu − → +: cực tiểu"] },
      { title: 'Quy tắc 2', bullets: ["f'(x₀) = 0 và f''(x₀) > 0 → cực tiểu", "f'(x₀) = 0 và f''(x₀) < 0 → cực đại", "f''(x₀) = 0 → quay về quy tắc 1"] },
      { title: 'Dạng bài tham số', bullets: ['Bậc 3: 2 cực trị ⇔ Δ(y\') > 0', 'Bậc 4 trùng phương: 3 cực trị ⇔ ab < 0'] },
    ],
    faq: [
      { match: /khác.*gtln|gtnn|lớn nhất/i, answer: 'Cực trị là khái niệm ĐỊA PHƯƠNG (so trong lân cận), còn GTLN/GTNN là TOÀN CỤC (so trên cả miền). Giá trị cực đại hoàn toàn có thể nhỏ hơn giá trị cực tiểu ở chỗ khác.' },
      { match: /quy tắc (1|2|nào)/i, answer: 'Dùng quy tắc 1 khi xét dấu f\' dễ (đa thức). Dùng quy tắc 2 khi tính f\'\' nhanh và nghiệm f\'=0 đẹp (hàm lượng giác). Lưu ý quy tắc 2 thất bại khi f\'\'(x₀) = 0.' },
    ],
  },
  {
    match: /lớn nhất|nhỏ nhất|gtln|gtnn/i,
    analysis: {
      summary:
        'Bài giảng hướng dẫn tìm GTLN, GTNN của hàm số liên tục trên một đoạn [a;b]: tính f\' , tìm các nghiệm xᵢ trong (a;b), so sánh f(a), f(b), f(xᵢ). Định lý Weierstrass đảm bảo max/min tồn tại.',
      concepts: ['GTLN/GTNN trên đoạn', 'Định lý Weierstrass', 'So sánh giá trị tại biên và điểm tới hạn'],
      objectives: ['Tìm max/min trên đoạn theo 3 bước', 'Ứng dụng vào bài toán thực tế (tối ưu)'],
    },
    exercises: [
      { question: 'Tìm GTLN, GTNN của y = x³ − 3x + 2 trên [0; 2].', hint: "y' = 3x² − 3 = 0 ⇔ x = ±1, chỉ lấy x = 1.", solution: 'y(0) = 2, y(1) = 0, y(2) = 4 → max = 4 tại x = 2, min = 0 tại x = 1.' },
      { question: 'Tìm GTNN của y = x + 4/x trên (0; +∞).', hint: 'Dùng đạo hàm hoặc AM-GM.', solution: "y' = 1 − 4/x² = 0 ⇔ x = 2; y(2) = 4 là GTNN (AM-GM: x + 4/x ≥ 2√4 = 4)." },
      { question: 'Một mảnh vườn hình chữ nhật có chu vi 40m. Tìm kích thước để diện tích lớn nhất.', hint: 'S = x(20 − x).', solution: 'S = 20x − x², S\' = 20 − 2x = 0 ⇔ x = 10 → hình vuông 10×10, S_max = 100 m².' },
    ],
    slides: [
      { title: 'GTLN – GTNN trên đoạn', bullets: ['Hàm liên tục trên [a;b] luôn có max, min (Weierstrass)'] },
      { title: 'Quy trình 3 bước', bullets: ["B1: Tính f'(x), tìm nghiệm xᵢ ∈ (a;b)", 'B2: Tính f(a), f(b), f(xᵢ)', 'B3: So sánh → kết luận'] },
      { title: 'Trên khoảng mở thì sao?', bullets: ['Phải lập bảng biến thiên', 'Max/min có thể KHÔNG tồn tại', 'Chú ý giới hạn tại biên'] },
      { title: 'Bài toán thực tế', bullets: ['Lập hàm mục tiêu theo 1 biến', 'Tìm điều kiện của biến', 'Tối ưu bằng đạo hàm'] },
    ],
    faq: [
      { match: /khoảng mở|không.*đoạn/i, answer: 'Trên khoảng mở (a;b), max/min có thể không tồn tại vì hàm không đạt giá trị tại biên. Phải lập bảng biến thiên đầy đủ với giới hạn hai đầu rồi kết luận.' },
    ],
  },
  {
    match: /lũy thừa/i,
    analysis: {
      summary:
        'Bài giảng mở rộng khái niệm lũy thừa từ số mũ nguyên dương sang số mũ nguyên âm, hữu tỉ, vô tỉ; các tính chất aᵐ·aⁿ = aᵐ⁺ⁿ, (aᵐ)ⁿ = aᵐⁿ; khảo sát hàm lũy thừa y = xᵅ và điều kiện xác định theo α.',
      concepts: ['Lũy thừa số mũ hữu tỉ, thực', 'Căn bậc n', 'Hàm số lũy thừa và tập xác định', 'Đồ thị hàm lũy thừa'],
      objectives: ['Rút gọn biểu thức lũy thừa', 'Xác định đúng tập xác định theo số mũ', 'So sánh các lũy thừa'],
    },
    exercises: [
      { question: 'Rút gọn A = (a^(4/3) · a^(−1/3)) / a^(1/2) với a > 0.', hint: 'Cộng trừ số mũ cùng cơ số.', solution: 'A = a^(4/3 − 1/3 − 1/2) = a^(1/2) = √a.' },
      { question: 'So sánh 2^300 và 3^200.', hint: 'Đưa về cùng số mũ 100.', solution: '2^300 = 8^100, 3^200 = 9^100 → 3^200 > 2^300.' },
      { question: 'Tìm tập xác định của y = (x² − 4)^(−3) và y = (x − 1)^(1/3).', hint: 'Số mũ nguyên âm ≠ số mũ hữu tỉ không nguyên.', solution: 'Mũ nguyên âm: x ≠ ±2. Mũ hữu tỉ không nguyên: cần x − 1 > 0, tức x > 1.' },
    ],
    slides: [
      { title: 'Lũy thừa & hàm số lũy thừa', bullets: ['Mở rộng số mũ: nguyên → hữu tỉ → thực'] },
      { title: 'Tính chất lũy thừa', bullets: ['aᵐ·aⁿ = aᵐ⁺ⁿ', '(aᵐ)ⁿ = aᵐⁿ', '(ab)ᵐ = aᵐbᵐ', 'a⁰ = 1 (a ≠ 0)'] },
      { title: 'Tập xác định của y = xᵅ', bullets: ['α nguyên dương: ℝ', 'α nguyên âm hoặc 0: ℝ\\{0}', 'α không nguyên: (0; +∞)'] },
      { title: 'Đồ thị', bullets: ['Luôn qua điểm (1; 1)', 'α > 0: đồng biến trên (0;+∞)', 'α < 0: nghịch biến trên (0;+∞)'] },
    ],
    faq: [
      { match: /tập xác định/i, answer: 'Nhớ 3 trường hợp theo số mũ α: nguyên dương → ℝ; nguyên âm/0 → x ≠ 0; không nguyên → x > 0. Đây là câu hỏi trắc nghiệm rất hay gặp.' },
    ],
  },
  {
    match: /logarit|phương trình mũ/i,
    analysis: {
      summary:
        'Bài giảng định nghĩa logarit (log_a b = c ⇔ aᶜ = b, với 0 < a ≠ 1, b > 0), các quy tắc log của tích/thương/lũy thừa, công thức đổi cơ số, và phương pháp giải phương trình mũ – logarit cơ bản (đưa về cùng cơ số, đặt ẩn phụ, logarit hóa).',
      concepts: ['Định nghĩa logarit', 'Quy tắc tính logarit', 'Đổi cơ số', 'Phương trình mũ cơ bản', 'Phương trình logarit và điều kiện xác định'],
      objectives: ['Tính và biến đổi biểu thức logarit', 'Giải PT mũ/logarit bằng 3 phương pháp chính', 'Luôn kiểm tra điều kiện xác định'],
    },
    exercises: [
      { question: 'Giải phương trình 4^x − 3·2^x + 2 = 0.', hint: 'Đặt t = 2^x > 0.', solution: 't² − 3t + 2 = 0 ⇔ t = 1 hoặc t = 2 → x = 0 hoặc x = 1.' },
      { question: 'Giải log₂(x − 1) + log₂(x + 1) = 3.', hint: 'Điều kiện x > 1; tổng log = log tích.', solution: 'log₂(x² − 1) = 3 ⇔ x² − 1 = 8 ⇔ x = 3 (loại x = −3 do điều kiện).' },
      { question: 'Cho log₂ 5 = a. Tính log₄ 50 theo a.', hint: '50 = 2 · 25; đổi cơ số 4 = 2².', solution: 'log₄ 50 = log₂ 50 / 2 = (1 + 2a)/2.' },
    ],
    slides: [
      { title: 'Logarit', bullets: ['log_a b = c ⇔ aᶜ = b', 'Điều kiện: 0 < a ≠ 1, b > 0'] },
      { title: 'Quy tắc tính', bullets: ['log(xy) = log x + log y', 'log(x/y) = log x − log y', 'log xⁿ = n·log x', 'Đổi cơ số: log_a b = ln b / ln a'] },
      { title: 'Phương trình mũ', bullets: ['Cùng cơ số: a^f = a^g ⇔ f = g', 'Đặt ẩn phụ t = a^x > 0', 'Logarit hóa hai vế'] },
      { title: 'Phương trình logarit', bullets: ['LUÔN đặt điều kiện trước', 'log_a f = log_a g ⇔ f = g > 0', 'Đối chiếu nghiệm với điều kiện'] },
    ],
    faq: [
      { match: /điều kiện/i, answer: 'Với phương trình logarit, đặt điều kiện TRƯỚC khi biến đổi: mọi biểu thức trong log phải dương, cơ số dương khác 1. Sau khi giải xong phải đối chiếu — rất nhiều bạn mất điểm vì quên bước này.' },
      { match: /đặt ẩn phụ/i, answer: 'Khi phương trình chứa a^x và a^2x, đặt t = a^x với điều kiện t > 0. Nhớ loại nghiệm t ≤ 0 trước khi giải ngược ra x.' },
    ],
  },
  {
    match: /nguyên hàm/i,
    analysis: {
      summary:
        'Bài giảng định nghĩa nguyên hàm (F\' = f), tính chất họ nguyên hàm F(x) + C, bảng nguyên hàm cơ bản, và hai phương pháp chính: đổi biến số và nguyên hàm từng phần ∫u dv = uv − ∫v du.',
      concepts: ['Định nghĩa nguyên hàm', 'Bảng nguyên hàm cơ bản', 'Đổi biến số', 'Nguyên hàm từng phần'],
      objectives: ['Thuộc bảng nguyên hàm', 'Chọn đúng phương pháp cho từng dạng', 'Ưu tiên "log-đa-lượng-mũ" khi từng phần'],
    },
    exercises: [
      { question: 'Tìm ∫(3x² − 2x + 5) dx.', hint: 'Nguyên hàm từng hạng tử.', solution: 'x³ − x² + 5x + C.' },
      { question: 'Tìm ∫x·eˣ dx.', hint: 'Từng phần: u = x, dv = eˣdx.', solution: 'x·eˣ − ∫eˣdx = (x − 1)eˣ + C.' },
      { question: 'Tìm ∫x/(x² + 1) dx.', hint: 'Đổi biến t = x² + 1.', solution: 'dt = 2x dx → (1/2)∫dt/t = (1/2)ln(x² + 1) + C.' },
    ],
    slides: [
      { title: 'Nguyên hàm', bullets: ["F là nguyên hàm của f ⇔ F' = f", 'Họ nguyên hàm: F(x) + C'] },
      { title: 'Bảng nguyên hàm cơ bản', bullets: ['∫xⁿdx = xⁿ⁺¹/(n+1) + C', '∫1/x dx = ln|x| + C', '∫eˣdx = eˣ + C', '∫cos x dx = sin x + C', '∫sin x dx = −cos x + C'] },
      { title: 'Đổi biến số', bullets: ['Nhận diện f(u(x))·u\'(x)', 'Đặt t = u(x), dt = u\'(x)dx'] },
      { title: 'Từng phần', bullets: ['∫u dv = uv − ∫v du', 'Ưu tiên chọn u: log → đa thức → lượng giác → mũ'] },
    ],
    faq: [
      { match: /từng phần|chọn u/i, answer: 'Quy tắc chọn u khi từng phần: "Nhất log, nhì đa, tam lượng, tứ mũ" — gặp ln x thì u = ln x, gặp x·eˣ thì u = x. dv là phần còn lại.' },
      { match: /quên.*c|hằng số/i, answer: 'Luôn cộng C vào kết quả nguyên hàm bất định — thiếu C là sai bản chất vì nguyên hàm là MỘT HỌ hàm, không phải một hàm duy nhất.' },
    ],
  },
  {
    match: /tích phân|diện tích/i,
    analysis: {
      summary:
        'Bài giảng định nghĩa tích phân xác định qua công thức Newton–Leibniz ∫ₐᵇf(x)dx = F(b) − F(a), các tính chất tuyến tính và cộng đoạn, ứng dụng tính diện tích hình phẳng S = ∫ₐᵇ|f(x)|dx và thể tích khối tròn xoay V = π∫ₐᵇf²(x)dx.',
      concepts: ['Công thức Newton–Leibniz', 'Tính chất tích phân', 'Diện tích hình phẳng', 'Thể tích khối tròn xoay'],
      objectives: ['Tính tích phân bằng nguyên hàm', 'Tính diện tích giữa hai đường cong', 'Nhớ lấy trị tuyệt đối khi tính diện tích'],
    },
    exercises: [
      { question: 'Tính I = ∫₀¹(x² + 2x)dx.', hint: 'Nguyên hàm rồi thế cận.', solution: 'I = [x³/3 + x²]₀¹ = 1/3 + 1 = 4/3.' },
      { question: 'Tính diện tích hình phẳng giới hạn bởi y = x² và y = x + 2.', hint: 'Tìm giao điểm: x² = x + 2.', solution: 'Giao tại x = −1, 2. S = ∫₋₁²(x + 2 − x²)dx = 9/2.' },
      { question: 'Tính thể tích khối tròn xoay khi quay y = √x quanh Ox, 0 ≤ x ≤ 4.', hint: 'V = π∫f²dx.', solution: 'V = π∫₀⁴x dx = π · 8 = 8π.' },
    ],
    slides: [
      { title: 'Tích phân xác định', bullets: ['∫ₐᵇf(x)dx = F(b) − F(a)', 'Ý nghĩa hình học: diện tích đại số'] },
      { title: 'Tính chất', bullets: ['Tuyến tính: ∫(αf + βg) = α∫f + β∫g', 'Cộng đoạn: ∫ₐᵇ = ∫ₐᶜ + ∫ᶜᵇ', 'Đổi cận đổi dấu'] },
      { title: 'Diện tích hình phẳng', bullets: ['S = ∫ₐᵇ|f(x) − g(x)|dx', 'Tìm giao điểm để phá trị tuyệt đối'] },
      { title: 'Thể tích tròn xoay', bullets: ['Quanh Ox: V = π∫ₐᵇf²(x)dx', 'Chú ý bình phương TRƯỚC khi tích phân'] },
    ],
    faq: [
      { match: /trị tuyệt đối|âm/i, answer: 'Diện tích luôn dương nên phải lấy |f(x)|. Cách làm chuẩn: tìm nghiệm f(x) = 0 trên [a;b], tách thành các đoạn con mà f không đổi dấu, rồi cộng các tích phân với dấu phù hợp.' },
    ],
  },
];

const GENERIC: Omit<Topic, 'match'> = {
  analysis: {
    summary: 'Bài giảng thuộc chương trình Toán 12, cung cấp kiến thức nền tảng và bài tập vận dụng theo định hướng thi THPT Quốc gia.',
    concepts: ['Khái niệm cơ bản của bài học', 'Công thức trọng tâm', 'Dạng bài điển hình'],
    objectives: ['Nắm vững lý thuyết', 'Vận dụng giải bài tập cơ bản và nâng cao'],
  },
  exercises: [
    { question: 'Ôn lại các công thức chính trong bài và tự lấy 2 ví dụ minh họa.', hint: 'Xem lại phần tóm tắt bài giảng.', solution: 'Học sinh tự trình bày; đối chiếu với nội dung video.' },
  ],
  slides: [
    { title: 'Tổng quan bài học', bullets: ['Khái niệm chính', 'Công thức cần nhớ'] },
    { title: 'Luyện tập', bullets: ['Làm quiz cuối bài để mở bài tiếp theo'] },
  ],
  faq: [],
};

function findTopic(title: string): Omit<Topic, 'match'> {
  return TOPICS.find((t) => t.match.test(title)) ?? GENERIC;
}

export class MockAIProvider implements AIProvider {
  private async topicFor(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error('Không tìm thấy bài học');
    return { topic: findTopic(lesson.title), lesson };
  }

  async analyzeLecture(lessonId: string) {
    const { topic } = await this.topicFor(lessonId);
    return topic.analysis;
  }

  async generateExercises(lessonId: string) {
    const { topic } = await this.topicFor(lessonId);
    return topic.exercises;
  }

  async generateSlides(lessonId: string) {
    const { topic, lesson } = await this.topicFor(lessonId);
    return [{ title: lesson.title, bullets: ['Toán Anh Thành — LMS', lesson.description] }, ...topic.slides];
  }

  async chat(lessonId: string, history: { role: string; content: string }[]) {
    const { topic, lesson } = await this.topicFor(lessonId);
    const question = history.filter((m) => m.role === 'user').pop()?.content ?? '';

    const hit = topic.faq.find((f) => f.match.test(question));
    if (hit) return hit.answer;

    if (/tóm tắt|nội dung/i.test(question)) return topic.analysis.summary;
    if (/bài tập|luyện/i.test(question))
      return `Bạn có thể luyện thêm: ${topic.exercises.map((e, i) => `\n${i + 1}. ${e.question}`).join('')}\n\nMở tab "Bài tập" để xem gợi ý và lời giải chi tiết nhé!`;
    if (/quiz|kiểm tra|điểm/i.test(question))
      return 'Quiz cuối bài nằm ở cuối trang. Bạn cần đạt tối thiểu 70% để mở bài tiếp theo. Nếu chưa đạt có thể làm lại không giới hạn số lần. Chúc bạn may mắn! 🍀';

    return `Câu hỏi hay đấy! Trong bài "${lesson.title}", các ý chính là: ${topic.analysis.concepts.join('; ')}. ${topic.analysis.summary} Bạn muốn mình giải thích sâu hơn phần nào?`;
  }
}
