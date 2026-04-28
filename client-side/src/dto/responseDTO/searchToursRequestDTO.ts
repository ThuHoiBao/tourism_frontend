// dto/requestDTO/SearchToursRequestDTO.ts

export class SearchToursRequestDTO {
    private _startPrice: number = 0;
    private _endPrice: number = 99999999999999;
    private _startPoint: string = "";
    private _endPoint: string = "";
    private _transportation: string = "";
    private _searchDestination: string="";
    private _departureDate!: Date; // Đã thêm

    // ------------------------------------
    // 📝 Getters (Phương thức lấy giá trị)
    // ------------------------------------

    get startPrice(): number {
        return this._startPrice;
    }

    get endPrice(): number {
        return this._endPrice;
    }

    get startPoint(): string {
        return this._startPoint;
    }

    get endPoint(): string {
        return this._endPoint;
    }


    get transportation(): string {
        return this._transportation;
    }
    get searchDestination(): string {
        return this._searchDestination;
    }
    
    // Getter cho _departureDate
    get departureDate(): Date {
        return this._departureDate;
    }

    // ------------------------------------
    // ✍️ Setters (Phương thức gán giá trị)
    // ------------------------------------

    set startPrice(value: number) {
        this._startPrice = value;
    }

    set endPrice(value: number) {
        this._endPrice = value;
    }

    set startPoint(value: string) {
        this._startPoint = value;
    }

    set endPoint(value: string) {
        this._endPoint = value;
    }

    set transportation(value: string) {
        this._transportation = value;
    }
    set searchDestination(value: string) {
        this._searchDestination = value;
    }
    // Setter cho _departureDate
    set departureDate(value: Date) {
        this._departureDate = value;
    }

    // ------------------------------------
    // 📦 Phương thức toPlain()
    // Chuyển DTO thành plain object (đối tượng JS thuần túy)
    // ------------------------------------
    toPlain() {
        return {
            startPrice: this._startPrice,
            endPrice: this._endPrice,
            startPoint: this._startPoint,
            endPoint: this._endPoint,
            transportation: this._transportation,
            searchDestination: this._searchDestination,
            departureDate: this._departureDate, // Đã thêm vào toPlain
        };
    }
}