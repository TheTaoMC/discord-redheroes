module.exports = `📜 **คู่มือการใช้งานบอท**

💼 **การจัดการเงินและ Inventory**:
- \`.balance\` - เช็คยอดเงิน, Karma และไอเท็มในกระเป๋าของคุณ
- \`.transfer @user <จำนวน>\` - โอนเงินให้ผู้ใช้อื่น (ระบุจำนวนเงิน)
- \`.top\` - แสดงรายชื่อผู้ใช้ที่มียอดเงินสูงสุด
- \`.daily\` - รับรายได้ประจำวัน (สามารถรับได้เพียงครั้งเดียวต่อวัน)

🧠 **การทำงานและระบบ Karma**:
- \`.work\` - เริ่มภาระงานเพื่อรับเงินและ Karma (ใครก็ตามสามารถเริ่มงานได้ แต่ตอบคำถามได้คนเดียว)
- \`.answer <คำตอบ>\` - ตอบคำถามจากภาระงานที่กำลังดำเนินอยู่
- \`.steal @user\` - พยายามขโมยเงินจากผู้ใช้อื่น (จำกัด 5 ครั้งต่อวัน, โอกาสสำเร็จ 50%)
- \`.mylog\` - แสดงประวัติการกระทำของคุณ เช่น การขโมย ซื้อไอเท็ม ฯลฯ

🛍 **ร้านค้า**:
- \`.shop\` - แสดงรายการไอเท็มที่สามารถซื้อได้จากร้านค้า
- \`.buy <เลขไอเท็ม>\` - ซื้อไอเท็มจากร้านค้า

⚙️ **คำสั่งอื่น ๆ**:
- \`.setroom <channel_id>\` - (เฉพาะ Admin) กำหนดห้องที่บอทสามารถทำงานได้ (ข้อมูลจะถูกเก็บในฐานข้อมูลถาวร)
- \`.help\` - แสดงคู่มือการใช้งานบอท
- \`.version\` - แสดงเวอร์ชันปัจจุบันของบอท
`;
