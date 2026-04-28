// src/dto/responseDTO/TourResponseDTO.ts
import { TourDepartureDateResponseDTO } from '../responseDTO/TourDepartureDateResponseDTO.ts';

export class TourResponseDTO {
    private _tourID: number = -1;
    private _tourCode: string = "";
    private _tourName: string = "";
    private _startPointName: string = ""; // Điểm khởi hành
    private _transportation: string = "";
    private _duration: string = "";
    private _departureDates: TourDepartureDateResponseDTO[] = [];
    private _money: number = 0; // Thay Long bằng number
    private _image: string = "";
    private _isFavorite: boolean = false;

    // --- Getters and Setters ---
    get tourID(): number { return this._tourID; }
    set tourID(value: number) { this._tourID = value; }

    get tourCode(): string { return this._tourCode; }
    set tourCode(value: string) { this._tourCode = value; }

    get tourName(): string { return this._tourName; }
    set tourName(value: string) { this._tourName = value; }

    get startPointName(): string { return this._startPointName; }
    set startPointName(value: string) { this._startPointName = value; }

    get transportation(): string { return this._transportation; }
    set transportation(value: string) { this._transportation = value; }

    get duration(): string { return this._duration; }
    set duration(value: string) { this._duration = value; }

    get departureDates(): TourDepartureDateResponseDTO[] { return this._departureDates; }
    // Setter xử lý mapping
    set departureDates(values: any[]) { 
        this._departureDates = values.map(TourDepartureDateResponseDTO.fromApiResponse);
    }

    get money(): number { return this._money; }
    set money(value: number) { this._money = value; }

    get image(): string { return this._image; }
    set image(value: string) { this._image = value; }

    get isFavorite(): boolean { return this._isFavorite; }
    set isFavorite(value: boolean) { this._isFavorite = value; }
    // Phương thức Ánh xạ từ API Response
    public static fromApiResponse(data: any): TourResponseDTO {
        const dto = new TourResponseDTO();
        dto.tourID = data.tourID;
        dto.tourCode = data.tourCode;
        dto.tourName = data.tourName;
        dto.startPointName = data.startPointName;
        dto.transportation = data.transportation;
        dto.duration = data.duration;
        dto.departureDates = data.departureDates || []; // Sẽ kích hoạt setter
        dto.money = data.money;
        dto.image = data.image;
        dto.isFavorite = data.isFavorite || false;
        return dto;
    }

    // Phương thức toPlain cho React Component
    toPlain() {
        return {
            tourID: this.tourID,
            tourCode: this.tourCode,
            tourName: this.tourName,
            startPointName: this.startPointName,
            transportation: this.transportation,
            duration: this.duration,
            // Chuyển danh sách ngày khởi hành thành plain object với ngày đã format
            departureDates: this.departureDates.map(d => ({
                departureID: d.departureID,
                departureDate: d.departureDateFormatted, 
                fullDate: d.departureDate // Ngày đầy đủ (ISO string)
            })), 
            money: this.money,
            image: this.image,
            isFavorite: this.isFavorite
        };
    }
}