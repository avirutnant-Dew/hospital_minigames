const questions = [
    { "category": "GROW_PLUS", "question": "กลยุทธ์ใดที่เน้นการเพิ่มรายได้จากการขยายฐานลูกค้าใหม่?", "options": { "A": "Referral Link", "B": "Cost Cutting", "C": "Staff Reduction" }, "correct_answer": "A", "points": 1000000 },
    { "category": "GROW_PLUS", "question": "เป้าหมายรายได้ของ Smart Hospital 2026 อยู่ที่เท่าไหร่?", "options": { "A": "1,000 MB", "B": "1,150 MB", "C": "1,500 MB" }, "correct_answer": "B", "points": 2000000 },
    { "category": "GROW_PLUS", "question": "SBU ย่อมาจากอะไรในเชิงธุรกิจโรงพยาบาล?", "options": { "A": "Special Business Unit", "B": "Social Build Up", "C": "Strategic Business Unit" }, "correct_answer": "C", "points": 1000000 },
    { "category": "GROW_PLUS", "question": "กลยุทธ์ \"Up-selling\" ในโรงพยาบาลหมายถึงอะไร?", "options": { "A": "การแนะนำคูปองตรวจสุขภาพที่ครอบคลุมมากขึ้น", "B": "การลดราคายา", "C": "การปิดวอร์ดที่ไม่ทำกำไร" }, "correct_answer": "A", "points": 1500000 },
    { "category": "GROW_PLUS", "question": "ข้อใดไม่ใช่ส่วนหนึ่งของ Grow+ Strategy?", "options": { "A": "Revenue Stream Diversification", "B": "Market Expansion", "C": "Energy Saving" }, "correct_answer": "C", "points": 1000000 },
    { "category": "SAFE_ACT", "question": "ข้อใดคือลำดับแรกของความปลอดภัยผู้ป่วย (Patient Safety)?", "options": { "A": "Identification", "B": "Medication", "C": "Standard Precautions" }, "correct_answer": "A", "points": 1000000 },
    { "category": "SAFE_ACT", "question": "สัญลักษณ์สีเหลืองที่พื้นในโรงพยาบาลมักสื่อถึงอะไร?", "options": { "A": "ทางด่วน", "B": "ระวังพื้นลื่น/ต่างระดับ", "C": "จุดทิ้งขยะ" }, "correct_answer": "B", "points": 1000000 },
    { "category": "SAFE_ACT", "question": "การล้างมือ 7 ขั้นตอนช่วยลดความเสี่ยงอะไรมากที่สุด?", "options": { "A": "Infection", "B": "Fall", "C": "Fire" }, "correct_answer": "A", "points": 1500000 },
    { "category": "SAFE_ACT", "question": "เมื่อพบเหตุเพลิงไหม้ สิ่งแรกที่ควรทำคืออะไร?", "options": { "A": "R - Rescue", "B": "A - Alarm", "C": "C - Confine" }, "correct_answer": "A", "points": 1000000 },
    { "category": "SAFE_ACT", "question": "ความปลอดภัยในการบริหารยา (6 Rights) ข้อใดถูกต้อง?", "options": { "A": "Right Patient, Right Drug, Right Time", "B": "Right Color, Right Size, Right Price" }, "correct_answer": "A", "points": 2000000 },
    { "category": "PRO_CARE", "question": "หัวใจสำคัญของการบริการแบบ ProCare คืออะไร?", "options": { "A": "Speed Only", "B": "Empathy & Service Excellence", "C": "Cost Reduction" }, "correct_answer": "B", "points": 1000000 },
    { "category": "PRO_CARE", "question": "CSI ย่อมาจากอะไรในเชิงการบริการ?", "options": { "A": "Customer Satisfaction Index", "B": "Customer Service Improvement", "C": "Client Safety Indicator" }, "correct_answer": "A", "points": 1000000 },
    { "category": "PRO_CARE", "question": "การสร้าง \"Wow Experience\" ให้ลูกค้าควรเริ่มจากจุดใด?", "options": { "A": "การรับฟังปัญหา (Active Listening)", "B": "การให้ของแถม", "C": "การเดินหนีเมื่อโดนบ่น" }, "correct_answer": "A", "points": 1500000 },
    { "category": "PRO_CARE", "question": "กลยุทธ์ Smile Sparkle เน้นเรื่องใดมากที่สุด?", "options": { "A": "การแต่งกาย", "B": "การต้อนรับที่ยิ้มแย้มและเป็นมิตร", "C": "การรักษาด้วยยา" }, "correct_answer": "B", "points": 1000000 },
    { "category": "PRO_CARE", "question": "แนวคิด Patient Experience (PX) ต่างจาก Customer Service อย่างไร?", "options": { "A": "ไม่ต่างกัน", "B": "PX เน้นความรู้สึกตลอดเส้นทางการรับบริการ", "C": "PX เน้นเฉพาะตอนรอหมอ" }, "correct_answer": "B", "points": 2000000 }
];

const SUPABASE_URL = "https://pgvyvokqtwsbybfjwbgo.supabase.co";
const SERVICE_TOKEN = "sb_secret_oEu9SWuf8eAcN50IOIkBSw_mV4cRKOP";

async function seed() {
    console.log("Starting database seed...");

    for (const q of questions) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/challenge_questions`, {
                method: 'POST',
                headers: {
                    'apikey': SERVICE_TOKEN,
                    'Authorization': `Bearer ${SERVICE_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(q)
            });

            if (!response.ok) {
                const err = await response.text();
                console.error(`Failed to insert question: ${q.question}. Status: ${response.status}. Error: ${err}`);
            } else {
                console.log(`Successfully inserted: ${q.question.substring(0, 30)}...`);
            }
        } catch (err) {
            console.error(`Network error for question: ${q.question}. Error: ${err.message}`);
        }
    }

    console.log("Seeding complete.");
}

seed();
