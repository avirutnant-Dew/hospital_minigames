-- Seeding professional questions for Hospital Dash
-- Categories: GROW_PLUS, SAFE_ACT, PRO_CARE

INSERT INTO challenge_questions (category, question, options, correct_answer, points)
VALUES 
  -- GROW_PLUS
  ('GROW_PLUS', 'กลยุทธ์ใดที่เน้นการเพิ่มรายได้จากการขยายฐานลูกค้าใหม่?', '{"A": "Referral Link", "B": "Cost Cutting", "C": "Staff Reduction"}', 'A', 1000000),
  ('GROW_PLUS', 'เป้าหมายรายได้ของ Smart Hospital 2026 อยู่ที่เท่าไหร่?', '{"A": "1,000 MB", "B": "1,150 MB", "C": "1,500 MB"}', 'B', 2000000),
  ('GROW_PLUS', 'SBU ย่อมาจากอะไรในเชิงธุรกิจโรงพยาบาล?', '{"A": "Special Business Unit", "B": "Social Build Up", "C": "Strategic Business Unit"}', 'C', 1000000),
  ('GROW_PLUS', 'กลยุทธ์ "Up-selling" ในโรงพยาบาลหมายถึงอะไร?', '{"A": "การแนะนำคูปองตรวจสุขภาพที่ครอบคลุมมากขึ้น", "B": "การลดราคายา", "C": "การปิดวอร์ดที่ไม่ทำกำไร"}', 'A', 1500000),
  ('GROW_PLUS', 'ข้อใดไม่ใช่ส่วนหนึ่งของ Grow+ Strategy?', '{"A": "Revenue Stream Diversification", "B": "Market Expansion", "C": "Energy Saving"}', 'C', 1000000),

  -- SAFE_ACT
  ('SAFE_ACT', 'ข้อใดคือลำดับแรกของความปลอดภัยผู้ป่วย (Patient Safety)?', '{"A": "Identification", "B": "Medication", "C": "Standard Precautions"}', 'A', 1000000),
  ('SAFE_ACT', 'สัญลักษณ์สีเหลืองที่พื้นในโรงพยาบาลมักสื่อถึงอะไร?', '{"A": "ทางด่วน", "B": "ระวังพื้นลื่น/ต่างระดับ", "C": "จุดทิ้งขยะ"}', 'B', 1000000),
  ('SAFE_ACT', 'การล้างมือ 7 ขั้นตอนช่วยลดความเสี่ยงอะไรมากที่สุด?', '{"A": "Infection", "B": "Fall", "C": "Fire"}', 'A', 1500000),
  ('SAFE_ACT', 'เมื่อพบเหตุเพลิงไหม้ สิ่งแรกที่ควรทำคืออะไร?', '{"A": "R - Rescue", "B": "A - Alarm", "C": "C - Confine"}', 'A', 1000000),
  ('SAFE_ACT', 'ความปลอดภัยในการบริหารยา (6 Rights) ข้อใดถูกต้อง?', '{"A": "Right Patient, Right Drug, Right Time", "B": "Right Color, Right Size, Right Price", "C": "Right Staff, Right Room, Right Bed"}', 'A', 2000000),

  -- PRO_CARE
  ('PRO_CARE', 'หัวใจสำคัญของการบริการแบบ ProCare คืออะไร?', '{"A": "Speed Only", "B": "Empathy & Service Excellence", "C": "Cost Reduction"}', 'B', 1000000),
  ('PRO_CARE', 'CSI ย่อมาจากอะไรในเชิงการบริการ?', '{"A": "Customer Satisfaction Index", "B": "Customer Service Improvement", "C": "Client Safety Indicator"}', 'A', 1000000),
  ('PRO_CARE', 'การสร้าง "Wow Experience" ให้ลูกค้าควรเริ่มจากจุดใด?', '{"A": "การรับฟังปัญหา (Active Listening)", "B": "การให้ของแถม", "C": "การเดินหนีเมื่อโดนบ่น"}', 'A', 1500000),
  ('PRO_CARE', 'กลยุทธ์ Smile Sparkle เน้นเรื่องใดมากที่สุด?', '{"A": "การแต่งกาย", "B": "การต้อนรับที่ยิ้มแย้มและเป็นมิตร", "C": "การรักษาด้วยยา"}', 'B', 1000000),
  ('PRO_CARE', 'แนวคิด Patient Experience (PX) ต่างจาก Customer Service อย่างไร?', '{"A": "ไม่ต่างกัน", "B": "PX เน้นความรู้สึกตลอดเส้นทางการรับบริการ", "C": "PX เน้นเฉพาะตอนรอหมอ"}', 'B', 2000000);
