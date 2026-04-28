// src/dto/responseDTO/BookingResponseDTO.ts
import { BookingPassengerResponseDTO } from './BookingPassengerResponseDTO.ts';

export class BookingResponseDTO {
    private _bookingID: number = -1;
    private _bookingCode: string = "";
    private _bookingDate: string = ""; // LocalDateTime -> string ISO
    private _contactEmail: string = "";
    private _contactFullName: string = "";
    private _contactPhone: string = "";
    private _contactAddress: string = "";
    private _customerNote: string = "";
    private _totalPassengers: number = 0;
    
    // Đã đổi tên: overload -> surcharge
    private _surcharge: number = 0; 
    
    private _couponDiscount: number = 0;
    private _paidByCoin: number = 0;
    
    // Đã thêm trường mới: subtotalPrice
    private _subtotalPrice: number = 0; 
    
    private _totalPrice: number = 0;
    private _cancelReason: string = "";
    private _bookingStatus: string = "";
    private _departureID: number = -1;
    private _departureDate: string = ""; // LocalDate -> string
    private _tourID: number = -1;
    private _tourCode: string = "";
    private _tourName: string = "";
    private _image: string = "";
    private _paymentID: number = -1;
    private _amount: number = 0;
    private _timeLimit: string = ""; // LocalDateTime -> string ISO
    private _passengers: BookingPassengerResponseDTO[] = [];
    private _bank: string = "";
    private _accountNumber: string = "";
    private _accountName: string = "";
    private _refundBank: string = "";
    private _refundAccountNumber: string = "";
    private _refundAccountName: string = "";
    private _refundAmount: number = 0;

    // Getters
    get bookingID() { return this._bookingID; }
    get bookingCode() { return this._bookingCode; }
    get bookingDate() { return this._bookingDate; }
    get contactEmail() { return this._contactEmail; }
    get contactFullName() { return this._contactFullName; }
    get contactPhone() { return this._contactPhone; }
    get contactAddress() { return this._contactAddress; }
    get customerNote() { return this._customerNote; }
    get totalPassengers() { return this._totalPassengers; }
    
    // Getter mới cho Surcharge
    get surcharge() { return this._surcharge; }
    
    get couponDiscount() { return this._couponDiscount; }
    get paidByCoin() { return this._paidByCoin; }
    
    // Getter mới cho Subtotal Price
    get subtotalPrice() { return this._subtotalPrice; }
    
    get totalPrice() { return this._totalPrice; }
    get cancelReason() { return this._cancelReason; }
    get bookingStatus() { return this._bookingStatus; }
    get departureID() { return this._departureID; }
    get departureDate() { return this._departureDate; }
    get tourID() { return this._tourID; }
    get tourCode() { return this._tourCode; }
    get tourName() { return this._tourName; }
    get image() { return this._image; }
    get paymentID() { return this._paymentID; }
    get amount() { return this._amount; }
    get timeLimit() { return this._timeLimit; }
    get passengers() { return this._passengers; }
    get bank() { return this._bank; }
    get accountNumber() { return this._accountNumber; }
    get accountName() { return this._accountName; }
    get refundBank() { return this._refundBank; }
    get refundAccountNumber() { return this._refundAccountNumber; }
    get refundAccountName() { return this._refundAccountName; }
    get refundAmount() { return this._refundAmount; }
    /**
     * Phương thức ánh xạ từ API Response
     * @param data Dữ liệu raw từ API
     * @returns BookingResponseDTO instance
     */
    public static fromApiResponse(data: any): BookingResponseDTO {
        const dto = new BookingResponseDTO();
        dto._bookingID = data.bookingID || -1;
        dto._bookingCode = data.bookingCode || "";
        dto._bookingDate = data.bookingDate || "";
        dto._contactEmail = data.contactEmail || "";
        dto._contactFullName = data.contactFullName || "";
        dto._contactPhone = data.contactPhone || "";
        dto._contactAddress = data.contactAddress || "";
        dto._customerNote = data.customerNote || "";
        dto._totalPassengers = data.totalPassengers || 0;
        
        // Ánh xạ surcharge (từ data.overload hoặc data.surcharge nếu BE đã đổi)
        dto._surcharge = data.surcharge || data.overload || 0; 
        
        dto._couponDiscount = data.couponDiscount || 0;
        dto._paidByCoin = data.paidByCoin || 0;
        
        // Ánh xạ trường mới
        dto._subtotalPrice = data.subtotalPrice || 0; 
        
        dto._totalPrice = data.totalPrice || 0;
        dto._cancelReason = data.cancelReason || "";
        dto._bookingStatus = data.bookingStatus || "";
        dto._departureID = data.departureID || -1;
        dto._departureDate = data.departureDate || "";
        dto._tourID = data.tourID || -1;
        dto._tourCode = data.tourCode || "";
        dto._tourName = data.tourName || "";
        dto._image = data.image || "";
        dto._paymentID = data.paymentID || -1;
        dto._amount = data.amount || 0;
        dto._timeLimit = data.timeLimit || "";
        dto._bank = data.bank || "";
        dto._accountNumber = data.accountNumber || "";
        dto._accountName = data.accountName || "";
        dto._refundBank = data.refundBank || "";
        dto._refundAccountNumber = data.refundAccountNumber || "";
        dto._refundAccountName = data.refundAccountName || "";
        dto._refundAmount = data.refundAmount || 0;
        // Map danh sách hành khách
        dto._passengers = (data.passengers || []).map((p: any) => BookingPassengerResponseDTO.fromApiResponse(p));
        return dto;
    }

    /**
     * Chuyển đổi thành plain object để sử dụng trong React Component
     */
    public toPlain() {
        return {
            bookingID: this.bookingID,
            bookingCode: this.bookingCode,
            bookingDate: this.bookingDate,
            contactEmail: this.contactEmail,
            contactFullName: this.contactFullName,
            contactPhone: this.contactPhone,
            contactAddress: this.contactAddress,
            customerNote: this.customerNote,
            totalPassengers: this.totalPassengers,
            surcharge: this.surcharge, // Đã đổi tên
            couponDiscount: this.couponDiscount,
            paidByCoin: this.paidByCoin,
            subtotalPrice: this.subtotalPrice, // Trường mới
            totalPrice: this.totalPrice,
            cancelReason: this.cancelReason,
            bookingStatus: this.bookingStatus,
            departureID: this.departureID,
            departureDate: this.departureDate,
            tourID: this.tourID,
            tourCode: this.tourCode,
            tourName: this.tourName,
            image: this.image,
            paymentID: this.paymentID,
            amount: this.amount,
            timeLimit: this.timeLimit,
            bank: this.bank,
            accountNumber: this.accountNumber,
            accountName: this.accountName,
            refundBank: this.refundBank,
            refundAccountNumber: this.refundAccountNumber,
            refundAccountName: this.refundAccountName,
            refundAmount: this.refundAmount,
            passengers: this.passengers.map(p => p.toPlain())
        };
    }
}