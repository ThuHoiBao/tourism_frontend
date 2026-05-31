import axios from '../../utils/axiosCustomize';

/**
 * API lộ trình bản đồ tour (Leaflet pin theo Itinerary Day).
 * Response: { tourCode, stops, minLat..maxLng, availableDays }
 */
const tourRouteApi = {
    getRoute: (tourCode) =>
        axios.get(`/tours/${tourCode}/route`)
            .then((r) => r.data?.data ?? r.data),

    /** Composite: itinerary days + stops + globalIndex khớp. */
    getCombined: (tourCode) =>
        axios.get(`/tours/${tourCode}/itinerary-with-route`)
            .then((r) => r.data?.data ?? r.data),

    // Admin
    getStops: (tourId) =>
        axios.get(`/admin/tours/${tourId}/stops`)
            .then((r) => r.data?.data ?? r.data),

    upsertStops: (tourId, stops) =>
        axios.put(`/admin/tours/${tourId}/stops`, stops)
            .then((r) => r.data?.data ?? r.data),

    deleteStop: (stopId) =>
        axios.delete(`/admin/tours/stops/${stopId}`)
            .then((r) => r.data),
};

export default tourRouteApi;
