export class UserUpdateRequestDTO {
    private _fullName: string = "";
    private _phone: string = "";
    private _dateOfBirth: string = ""; // ISO date string format: YYYY-MM-DD

    // ------------------------------------
    // 📝 Getters and Setters
    // ------------------------------------

    get fullName(): string { return this._fullName; }
    set fullName(value: string) { this._fullName = value; }

    get phone(): string { return this._phone; }
    set phone(value: string) { this._phone = value; }

    get dateOfBirth(): string { return this._dateOfBirth; }
    set dateOfBirth(value: string) { this._dateOfBirth = value; }

    // ------------------------------------
    // 📦 Method to convert to plain object for API
    // ------------------------------------
    toPlain() {
        return {
            fullName: this._fullName,
            phone: this._phone,
            dateOfBirth: this._dateOfBirth,
        };
    }
}


