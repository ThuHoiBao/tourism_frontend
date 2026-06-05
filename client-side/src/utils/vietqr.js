// Sinh chuỗi VietQR (chuẩn NAPAS / EMVCo) ngay trên client — không phụ thuộc img.vietqr.io.
// Dùng với <QRCodeCanvas value={buildVietQRPayload(...)} />.

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — bắt buộc theo spec EMVCo.
const crc16 = (str) => {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

// TLV: id (2 ký tự) + length (2 ký tự, zero-pad) + value
const tlv = (id, value) => {
    const v = String(value ?? '');
    return id + String(v.length).padStart(2, '0') + v;
};

/**
 * Build payload VietQR động (có sẵn số tiền + nội dung).
 * @param {string} bin  Mã BIN ngân hàng 6 số (vd '970418' = BIDV)
 * @param {string} accountNumber  Số tài khoản (đã bỏ ký tự che)
 * @param {number|string} amount  Số tiền VND
 * @param {string} addInfo  Nội dung chuyển khoản
 */
export const buildVietQRPayload = (bin, accountNumber, amount, addInfo) => {
    const acc = String(accountNumber || '').replace(/\D/g, '');

    // Merchant Account Information (id 38) cho NAPAS
    const guid = tlv('00', 'A000000727');
    const acquirer = tlv('00', bin) + tlv('01', acc);          // 00=BIN, 01=số TK
    const benef = tlv('01', acquirer);                          // 01=beneficiary org
    const service = tlv('02', 'QRIBFTTA');                      // chuyển nhanh tới tài khoản
    const merchantAccount = tlv('38', guid + benef + service);

    const additional = addInfo ? tlv('62', tlv('08', addInfo)) : ''; // 62→08=nội dung

    let payload =
        tlv('00', '01') +                       // version
        tlv('01', '12') +                       // 11=tĩnh, 12=động (có amount)
        merchantAccount +
        tlv('53', '704') +                      // tiền tệ VND
        (amount ? tlv('54', String(Math.round(Number(amount)))) : '') +
        tlv('58', 'VN') +                       // quốc gia
        additional;

    payload += '6304';                          // id+len của CRC, CRC tính trên cả "6304"
    return payload + crc16(payload);
};
