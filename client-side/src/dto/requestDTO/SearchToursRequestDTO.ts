// src/dto/requestDTO/SearchToursRequestDTO.ts

export class SearchToursRequestDTO {
    private _searchNameTour: string = "";
    private _startPrice: number = 0;
    private _endPrice: number = 99999999999999; // Giá trị lớn để bao quát
    private _startLocationID: number = -1; // -1: Tất cả
    private _endLocationID: number = -1; // -1: Tất cả
    private _transportation: string = ""; // "" hoặc null: Tất cả
    private _rating: number = 0;
    // --- Getters và Setters ---
    get searchNameTour(): string { return this._searchNameTour; }
    set searchNameTour(value: string) { this._searchNameTour = value; }

    get startPrice(): number { return this._startPrice; }
    set startPrice(value: number) { this._startPrice = value; }

    get endPrice(): number { return this._endPrice; }
    set endPrice(value: number) { this._endPrice = value; }

    get startLocationID(): number { return this._startLocationID; }
    set startLocationID(value: number) { this._startLocationID = value; }

    get endLocationID(): number { return this._endLocationID; }
    set endLocationID(value: number) { this._endLocationID = value; }

    get transportation(): string { return this._transportation; }
    set transportation(value: string) { this._transportation = value; }

    get rating(): number { return this._rating; }
    set rating(value: number) { this._rating = value; }
    // Phương thức toPlain cho payload API
    toPlain() {
        // Chỉ gửi các trường có giá trị hợp lệ (-1 cho ID sẽ được backend xử lý)
        return {
            searchNameTour: this.searchNameTour,
            startPrice: this.startPrice,
            endPrice: this.endPrice,
            startLocationID: this.startLocationID === -1 ? null : this.startLocationID,
            endLocationID: this.endLocationID === -1 ? null : this.endLocationID,
            transportation: this.transportation || null,
            rating: this.rating === 0 ? null : this.rating, // Gửi null nếu rỗng
        };
    }
}