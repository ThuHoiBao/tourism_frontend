
export class TourRequestDTO {
    private _tourID: number = -1;
    private _tourCode: string = "";
    private _tourName: string = "";
    private _endPointName: string = ""; 
    private _transportation: string = "";
    private _duration: string = "";
    
    // Lưu ý: Backend trả về List<LocalDate>, Frontend nhận List<string> (ISO date string)
    private _departureDate: string[] = []; 
    
    private _money: number = 0; // Giá thấp nhất (Long Java -> number TS)
    private _image: string = ""; // Ảnh chính

    // ------------------------------------
    // 📝 Getters and Setters (Phương thức truy cập)
    // ------------------------------------

    get tourID(): number { return this._tourID; }
    set tourID(value: number) { this._tourID = value; }

    get tourCode(): string { return this._tourCode; }
    set tourCode(value: string) { this._tourCode = value; }

    get tourName(): string { return this._tourName; }
    set tourName(value: string) { this._tourName = value; }

    // DTO mới: Tên điểm đến (endPointName)
    get endPointName(): string { return this._endPointName; }
    set endPointName(value: string) { this._endPointName = value; }

    get transportation(): string { return this._transportation; }
    set transportation(value: string) { this._transportation = value; }

    get duration(): string { return this._duration; }
    set duration(value: string) { this._duration = value; }

    // DTO mới: Danh sách ngày khởi hành (string[])
    get departureDate(): string[] { return this._departureDate; }
    set departureDate(value: string[]) { this._departureDate = value; }

    // DTO mới: Giá thấp nhất (money)
    get money(): number { return this._money; }
    set money(value: number) { this._money = value; }

    // DTO mới: Ảnh chính (image)
    get image(): string { return this._image; }
    set image(value: string) { this._image = value; }
    
    // ------------------------------------
    // 📦 Phương thức toPlain()
    // Giữ lại để tương thích với các hooks mock data khác
    // ------------------------------------
        public static fromPlain(plainData: any): TourRequestDTO {
        const dto = new TourRequestDTO();
        
        // Sử dụng Setter để gán giá trị (từ plainData.id sang private field _tourID)
        // Lưu ý: Tên trường trong plainData là tên được trả về từ .toPlain()
        dto.tourID = plainData.id || plainData.tourID; 
        dto.tourCode = plainData.tourCode;
        dto.tourName = plainData.tourName;
        dto.endPointName = plainData.endPointName; 
        dto.transportation = plainData.transportation;
        dto.duration = plainData.duration;
        dto.departureDate = plainData.departureDate;
        dto.money = plainData.money;
        dto.image = plainData.image;

        return dto;
    }
    toPlain() {
        // Tên trường trong toPlain phải là camelCase (giống như tên getter)
        return {
            id: this._tourID,
            tourCode: this._tourCode,
            tourName: this._tourName,
            endPointName: this._endPointName, 
            transportation: this._transportation,
            duration: this._duration,
            departureDate: this._departureDate,
            money: this._money,
            image: this._image,
        };
    }
}