// src/dto/responseDTO/BookingPassengerResponseDTO.ts

export class BookingPassengerResponseDTO {
    private _bookingPassengerID: number = -1;
    private _fullName: string = "";
    private _gender: string = "";
    private _dateOfBirth: string = ""; // LocalDate -> string ISO
    private _passengerType: string = "";
    private _basePrice: number = 0;
    private _requiresSingleRoom: boolean = false;
    private _singleRoomSurcharge: number = 0;

    // Getters
    get bookingPassengerID() { return this._bookingPassengerID; }
    get fullName() { return this._fullName; }
    get gender() { return this._gender; }
    get dateOfBirth() { return this._dateOfBirth; }
    get passengerType() { return this._passengerType; }
    get basePrice() { return this._basePrice; }
    get requiresSingleRoom() { return this._requiresSingleRoom; }
    get singleRoomSurcharge() { return this._singleRoomSurcharge; }

    /**
     * Phương thức ánh xạ từ API Response (giả định BigDecimal và Integer được map thành number)
     * @param data Dữ liệu raw từ API
     * @returns BookingPassengerResponseDTO instance
     */
    public static fromApiResponse(data: any): BookingPassengerResponseDTO {
        const dto = new BookingPassengerResponseDTO();
        dto._bookingPassengerID = data.bookingPassengerID || -1;
        dto._fullName = data.fullName || "";
        dto._gender = data.gender || "";
        dto._dateOfBirth = data.dateOfBirth || "";
        dto._passengerType = data.passengerType || "";
        dto._basePrice = data.basePrice || 0;
        dto._requiresSingleRoom = data.requiresSingleRoom || false;
        dto._singleRoomSurcharge = data.singleRoomSurcharge || 0;
        return dto;
    }

    /**
     * Chuyển đổi thành plain object để sử dụng trong React Component
     */
    public toPlain() {
        return {
            bookingPassengerID: this.bookingPassengerID,
            fullName: this.fullName,
            gender: this.gender,
            dateOfBirth: this.dateOfBirth,
            passengerType: this.passengerType,
            basePrice: this.basePrice,
            requiresSingleRoom: this.requiresSingleRoom,
            singleRoomSurcharge: this.singleRoomSurcharge
        };
    }
}