// src/dto/responseDTO/LocationDataDTO.ts

// Chuyển từ interface sang class để đảm bảo khả năng export/import module
export class LocationDataDTO { 
    public locationID: number = -1;
    public name: string = "";
    public imageUrl: string = "";
    public description: string = "";

    // Constructor để hỗ trợ tạo object từ dữ liệu API
    constructor(data: any = {}) {
        this.locationID = data.locationID || -1;
        this.name = data.name || "";
        this.imageUrl = data.imageUrl || "";
        this.description = data.description || "";
    }
}