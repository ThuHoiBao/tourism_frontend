// src/dto/responseDTO/TourDepartureDateResponseDTO.ts
import { format } from 'date-fns';

export class TourDepartureDateResponseDTO {
    private _departureID: number = -1;
    // Backend trả về LocalDate (string ISO format, e.g., "2025-12-31")
    private _departureDate: string = ""; 

    // --- Getters and Setters ---
    get departureID(): number { return this._departureID; }
    set departureID(value: number) { this._departureID = value; }

    // Getter đặc biệt: Format ngày tháng sang 'dd/MM'
    get departureDateFormatted(): string {
        if (!this._departureDate) return "";
        try {
            // Giả định backend trả về "YYYY-MM-DD"
            // Lưu ý: format(new Date(string)) có thể gây ra lỗi múi giờ, nhưng đây là cách đơn giản nhất cho FE.
            return format(new Date(this._departureDate), 'dd/MM');
        } catch (e) {
            console.error("Invalid date format:", this._departureDate);
            return this._departureDate; 
        }
    }

    get departureDate(): string { return this._departureDate; }
    set departureDate(value: string) { this._departureDate = value; }

    // Phương thức Ánh xạ từ API Response
    public static fromApiResponse(data: any): TourDepartureDateResponseDTO {
        const dto = new TourDepartureDateResponseDTO();
        dto.departureID = data.departureID;
        dto.departureDate = data.departureDate;
        return dto;
    }
}