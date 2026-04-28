import { format } from 'date-fns';

export class TourSpecialRequestDTO {
    private _departureID: number = -1;
    private _tourID: number = -1;
    private _tourName: string = "";
    private _tourCode: string = "";
    private _startLocationName: string = "";
    private _duration: string = "";
    // Backend trả về LocalDate (string ISO format), Frontend có thể nhận Date hoặc string
    private _departureDate: string = ""; 
    private _availableSlots: number = 0;
    // BigDecimal từ Java được truyền dưới dạng number hoặc string
    private _salePrice: number = 0; 
    private _originalPrice: number = 0;
    private _discountPercentage: number = 0; 
    private _image: string = "";
    // --- Getters and Setters ---

    get departureID(): number { return this._departureID; }
    set departureID(value: number) { this._departureID = value; }

    get tourID(): number { return this._tourID; }
    set tourID(value: number) { this._tourID = value; }

    get tourName(): string { return this._tourName; }
    set tourName(value: string) { this._tourName = value; }

    get tourCode(): string { return this._tourCode; }
    set tourCode(value: string) { this._tourCode = value; }

    get startLocationName(): string { return this._startLocationName; }
    set startLocationName(value: string) { this._startLocationName = value; }

    get duration(): string { return this._duration; }
    set duration(value: string) { this._duration = value; }

    get availableSlots(): number { return this._availableSlots; }
    set availableSlots(value: number) { this._availableSlots = value; }

    get salePrice(): number { return this._salePrice; }
    set salePrice(value: number) { this._salePrice = value; }

    get originalPrice(): number { return this._originalPrice; }
    set originalPrice(value: number) { this._originalPrice = value; }

    get discountPercentage(): number { return this._discountPercentage; }
    set discountPercentage(value: number) { this._discountPercentage = value; }

    get image(): string { return this._image; }
    set image(value: string) { this._image = value; }
    get departureDate(): string {
        if (!this._departureDate) return "";
        try {
            // Giả định backend trả về "YYYY-MM-DD"
            return format(new Date(this._departureDate), 'dd/MM/yyyy');
        } catch (e) {
            console.error("Invalid date format:", this._departureDate);
            return this._departureDate; 
        }
    }
    set departureDate(value: string) { this._departureDate = value; }


    // --- Phương thức Ánh xạ từ API Response ---
    public static fromApiResponse(data: any): TourSpecialRequestDTO {
        const dto = new TourSpecialRequestDTO();

        dto.departureID = data.departureID;
        dto.tourID = data.tourID;
        dto.tourName = data.tourName;
        dto.tourCode = data.tourCode;
        dto.startLocationName = data.startLocationName;
        dto.duration = data.duration;
        dto.departureDate = data.departureDate; 
        dto.availableSlots = data.availableSlots;
        dto.salePrice = data.salePrice;
        dto.originalPrice = data.originalPrice;
        dto.discountPercentage = data.discountPercentage;
        dto.image = data.image;
        return dto;
    }

    // Phương thức toPlain (nếu cần cho React component)
    toPlain() {
        return {
            departureID: this.departureID,
            tourID: this.tourID,
            tourName: this.tourName,
            tourCode: this.tourCode,
            startLocationName: this.startLocationName,
            duration: this.duration,
            departureDate: this.departureDate, // Dùng getter đã format
            availableSlots: this.availableSlots,
            salePrice: this.salePrice,
            originalPrice: this.originalPrice,
            discountPercentage: this.discountPercentage,
            image:this.image
        };
    }
}