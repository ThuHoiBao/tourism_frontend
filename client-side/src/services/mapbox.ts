// File: src/services/api/mapbox.ts (CHỈNH SỬA LOGIC LẤY ẢNH)

export interface AutocompletePrediction {
    place_id: string; 
    description: string; 
    type: 'destination' | 'attraction'; 
    main_text: string; 
    secondary_text: string; 
    photo_url?: string; 
}

// ⚠️ Đảm bảo bạn đã thay thế Access Token và Key thực tế vào đây
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoidGh1cHJvMDk4IiwiYSI6ImNtaTdkMjJkODAzanQya3B2d2FvdzFrbHAifQ.EG_c7w3-BEjJbHDdGNWYAA"; 
const MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

const UNSPLASH_ACCESS_KEY = "SBMlHi-ORpRk-WYOZcpnD-DxC4yUwmynAfyLzErYpX4"; 
const UNSPLASH_URL = "https://api.unsplash.com/search/photos";

/**
 * Hàm lấy URL ảnh từ Unsplash dựa trên từ khóa tìm kiếm (Async)
 */
const fetchUnsplashPhotoUrl = async (keyword: string): Promise<string | undefined> => {
    // ... (Code cũ không đổi) ...
    try {
        const query = `${keyword} travel landscape`;
        
        const params = new URLSearchParams({
            client_id: UNSPLASH_ACCESS_KEY,
            query: query,
            per_page: '1',
            orientation: 'squarish' 
        });

        const url = `${UNSPLASH_URL}?${params.toString()}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Unsplash API failed for keyword: ${keyword}. Status: ${response.status}`);
            return undefined; 
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results[0].urls.thumb; 
        }
        return undefined;
    } catch (error) {
        // console.error("Lỗi khi tải ảnh từ Unsplash:", error); // Bỏ comment nếu cần debug
        return undefined;
    }
};


export const fetchPlaceAutocomplete = async (input: string): Promise<AutocompletePrediction[]> => {
    if (!input || input.length < 2) {
        return [];
    }
    
    try {
        // 1. GỌI MAPBOX GEOCODING (BƯỚC NÀY NHANH HƠN)
        const mapboxParams = new URLSearchParams({
            access_token: MAPBOX_ACCESS_TOKEN,
            country: 'vn',
            language: 'vi',
            autocomplete: 'true',
        });

        const mapboxUrl = `${MAPBOX_URL}${encodeURIComponent(input)}.json?${mapboxParams.toString()}`;
        const mapboxResponse = await fetch(mapboxUrl);
        
        if (!mapboxResponse.ok) {
             throw new Error(`Mapbox API request failed with status: ${mapboxResponse.status}`);
        }

        const data = await mapboxResponse.json();
        
        const uniquePredictionsMap = new Map<string, AutocompletePrediction>();

        data.features.forEach((feature: any) => {
            let type: 'destination' | 'attraction' = 'destination';
            
            if (feature.place_type.includes('poi') || feature.place_type.includes('attraction')) {
                type = 'attraction';
            }
            else if (feature.place_type.includes('place') || feature.place_type.includes('locality') || feature.place_type.includes('region')) {
                 type = 'destination';
            }

            const main_text = feature.text;
            let secondary_text = feature.place_name.replace(`${main_text},`, '').trim();
            secondary_text = secondary_text.replace(/,\s*Việt\s*Nam\s*$/, '').trim(); 
            
            if (secondary_text.length < 3) {
                const context = feature.context;
                const cityComponent = context.find((c: any) => c.id.startsWith('place') || c.id.startsWith('region'));
                if (cityComponent) {
                    secondary_text = cityComponent.text;
                }
            }

            const uniqueKey = `${main_text}|${secondary_text}`; 

            const prediction: AutocompletePrediction = {
                place_id: feature.id,
                description: feature.place_name,
                main_text: main_text,
                secondary_text: secondary_text,
                type: type, 
                photo_url: undefined as string | undefined,
            };

            if (!uniquePredictionsMap.has(uniqueKey)) {
                uniquePredictionsMap.set(uniqueKey, prediction);
            }
        });

        let predictions = Array.from(uniquePredictionsMap.values());

        // 2. LẤY URL ẢNH TỪ UNSPLASH (CHẠY SONG SONG VỚI Promise.all)
        // Tạo mảng Promise cho việc tìm kiếm ảnh
        const photoPromises = predictions.map(item => fetchUnsplashPhotoUrl(item.main_text));
        
        // Chờ tất cả Promise hoàn thành
        const photoUrls = await Promise.all(photoPromises);

        // Gán URL ảnh trở lại vào prediction tương ứng
        const finalResults = predictions.map((item, index) => {
            if (photoUrls[index]) {
                item.photo_url = photoUrls[index];
            }
            return item;
        });
        
        // Trả về TẤT CẢ trong một mảng duy nhất
        return finalResults;

    } catch (error) {
        throw error;
    }
};