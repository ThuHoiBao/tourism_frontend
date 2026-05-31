import axios from '../../utils/axiosCustomize';

/**
 * AI Review Summary API — tóm tắt review tour bằng AI.
 * Trả về { pros, cons, tips, reviewCountAtGen, avgRatingAtGen, cacheStatus, isStale, generatedAt }.
 * cacheStatus: HIT | STALE | MISS | GENERATED
 */
const reviewSummaryApi = {
    /** Public: lấy summary theo tourCode (FE đang dùng tourCode). */
    getByTourCode: (tourCode) =>
        axios.get(`/tours/${tourCode}/review-summary`)
            .then((r) => r.data?.data ?? r.data),

    /** Admin: force regen ngay theo tourId. */
    regenerate: (tourId) =>
        axios.post(`/admin/tours/${tourId}/review-summary/regenerate`)
            .then((r) => r.data?.data ?? r.data),
};

export default reviewSummaryApi;
