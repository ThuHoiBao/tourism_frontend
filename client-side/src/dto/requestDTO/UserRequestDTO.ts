export class UserRequestDTO {
    private _userID: number = -1;
    private _fullName: string = "";
    private _phone: string = "";
    private _dateOfBirth: string = ""; // ISO date string
    private _coinBalance: number = 0; // BigDecimal from Java -> number in TS
    private _email: string = "";
    private _avatar: string = ""; // Avatar URL cứng
    private _status: boolean = true;
    // ------------------------------------
    // 📝 Getters and Setters
    // ------------------------------------

    get userID(): number { return this._userID; }
    set userID(value: number) { this._userID = value; }

    get fullName(): string { return this._fullName; }
    set fullName(value: string) { this._fullName = value; }

    get phone(): string { return this._phone; }
    set phone(value: string) { this._phone = value; }

    get dateOfBirth(): string { return this._dateOfBirth; }
    set dateOfBirth(value: string) { this._dateOfBirth = value; }

    get coinBalance(): number { return this._coinBalance; }
    set coinBalance(value: number) { this._coinBalance = value; }

    get email(): string { return this._email; }
    set email(value: string) { this._email = value; }

    get avatar(): string { return this._avatar; }
    set avatar(value: string) { this._avatar = value; }

    get status(): boolean { return this._status; }
    set status(value: boolean) { this._status = value; }
    // ------------------------------------
    // 📦 Static method to create from API response
    // ------------------------------------
    public static fromApiResponse(apiResponse: any): UserRequestDTO {
        const dto = new UserRequestDTO();
        
        dto.userID = apiResponse.userID || apiResponse.userid || -1;
        dto.fullName = apiResponse.fullName || apiResponse.fullname || "";
        dto.phone = apiResponse.phone || "";
        dto.dateOfBirth = apiResponse.dateOfBirth || apiResponse.dateofbirth || "";
        dto.coinBalance = apiResponse.coinBalance || apiResponse.coinbalance || 0;
        dto.email = apiResponse.email || "";
        // Avatar giữ nguyên giá trị cứng, không lấy từ API
        dto.avatar = apiResponse.avatar|| "https://th.bing.com/th/id/OIP.KMh7jiRqiGInQryreHc-UwHaHa?w=180&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3";
        dto.status = apiResponse.status !== undefined ? apiResponse.status : true; 
        return dto;
    }

    // ------------------------------------
    // 📦 Method to convert to plain object
    // ------------------------------------
    toPlain() {
        return {
            userID: this._userID,
            fullName: this._fullName,
            phone: this._phone,
            dateOfBirth: this._dateOfBirth,
            coinBalance: this._coinBalance,
            email: this._email,
            avatar: this._avatar,
            status: this._status
        };
    }
}

