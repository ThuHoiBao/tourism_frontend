import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Calendar } from 'lucide-react';
import tourRouteApi from '../../../services/tour/tourRouteApi';
import styles from './TourRouteMap.module.scss';

const DAY_COLORS = ['#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2'];

const makeIcon = (number, color, active) => L.divIcon({
    className: styles.markerWrap,
    html: `<div class="${styles.markerPin} ${active ? styles.markerActive : ''}" style="background:${color}">
             <span>${number}</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

const FitBounds = ({ stops, trigger }) => {
    const map = useMap();
    useEffect(() => {
        if (stops.length === 0) return;
        if (stops.length === 1) {
            map.setView([stops[0].latitude, stops[0].longitude], 13);
            return;
        }
        const bounds = L.latLngBounds(stops.map(s => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [40, 40] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger]);
    return null;
};

/** Khi highlightedStop đổi: flyTo + open popup của pin tương ứng. */
const FlyToHighlight = ({ stop, markerRefs }) => {
    const map = useMap();
    useEffect(() => {
        if (!stop || stop.latitude == null) return;
        map.flyTo([stop.latitude, stop.longitude], 13, { duration: 0.8 });
        // Mở popup sau khi animate xong
        setTimeout(() => {
            const m = markerRefs.current[stop.stopId];
            if (m) m.openPopup();
        }, 850);
    }, [stop, map, markerRefs]);
    return null;
};

const TourRouteMap = ({ tourCode, combined, highlightedStop, onPinClick }) => {
    // Fallback: nếu không có combined (caller cũ), tự fetch route đơn
    const [route, setRoute] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const markerRefs = useRef({});
    const sectionRef = useRef(null);

    useEffect(() => {
        if (combined) return; // đã có data từ parent
        if (!tourCode) return;
        tourRouteApi.getRoute(tourCode).then(setRoute).catch(() => setRoute(null));
    }, [tourCode, combined]);

    // Gom flat stops + availableDays từ combined hoặc route legacy
    const { allStops, availableDays } = useMemo(() => {
        if (combined?.days?.length > 0) {
            const flat = [];
            const dayNums = new Set();
            combined.days.forEach(d => {
                (d.stops || []).forEach(s => {
                    flat.push({ ...s, dayNumber: d.dayNumber, dayTitle: d.title });
                    dayNums.add(d.dayNumber);
                });
            });
            (combined.orphanStops || []).forEach(s => flat.push({ ...s, dayNumber: null }));
            return { allStops: flat, availableDays: [...dayNums].sort((a, b) => a - b) };
        }
        // Fallback route legacy
        return {
            allStops: route?.stops || [],
            availableDays: route?.availableDays || [],
        };
    }, [combined, route]);

    // Chỉ scroll section map vào view khi nguồn highlight là ITINERARY
    // (user click row → muốn xem map). Nếu nguồn là chính map (user click pin),
    // không cần scroll vì map đã trong tầm nhìn.
    useEffect(() => {
        if (!highlightedStop) return;
        if (highlightedStop._source !== 'itinerary') return;
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [highlightedStop]);

    const visibleStops = useMemo(() => {
        if (allStops.length === 0) return [];
        return selectedDay == null
            ? allStops
            : allStops.filter(s => s.dayNumber === selectedDay);
    }, [allStops, selectedDay]);

    if (allStops.length === 0) return null;

    const center = [allStops[0].latitude, allStops[0].longitude];
    const polylinePath = visibleStops.map(s => [s.latitude, s.longitude]);

    return (
        <div className={styles.routeSection} ref={sectionRef}>
            <h3 className={styles.title}><MapPin size={18} /> Lộ trình tour trên bản đồ</h3>

            {availableDays.length > 0 && (
                <div className={styles.chips}>
                    <button
                        className={`${styles.chip} ${selectedDay == null ? styles.chipActive : ''}`}
                        onClick={() => setSelectedDay(null)}>
                        Tất cả ({allStops.length})
                    </button>
                    {availableDays.map(day => {
                        const count = allStops.filter(s => s.dayNumber === day).length;
                        const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];
                        return (
                            <button key={day}
                                style={{ '--accent': color }}
                                className={`${styles.chip} ${selectedDay === day ? styles.chipActive : ''}`}
                                onClick={() => setSelectedDay(day)}>
                                <Calendar size={12} /> Ngày {day} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            <MapContainer
                center={center}
                zoom={10}
                scrollWheelZoom={false}
                className={styles.mapContainer}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />
                <FitBounds stops={visibleStops} trigger={visibleStops.length + (selectedDay || 0)} />
                <FlyToHighlight stop={highlightedStop} markerRefs={markerRefs} />

                {visibleStops.map((s) => {
                    const color = s.dayNumber
                        ? DAY_COLORS[(s.dayNumber - 1) % DAY_COLORS.length]
                        : '#64748b';
                    const labelNum = s.globalIndex ?? '?';
                    const isActive = highlightedStop?.stopId === s.stopId;
                    return (
                        <Marker
                            key={s.stopId}
                            position={[s.latitude, s.longitude]}
                            icon={makeIcon(labelNum, color, isActive)}
                            ref={(el) => { if (el) markerRefs.current[s.stopId] = el; }}
                            eventHandlers={{
                                click: () => onPinClick?.(s),
                            }}
                        >
                            <Popup>
                                <div className={styles.popup}>
                                    <h4>{s.name}</h4>
                                    {s.dayNumber && (
                                        <span className={styles.popupDay}>
                                            Ngày {s.dayNumber}{s.dayTitle ? `: ${s.dayTitle}` : ''}
                                        </span>
                                    )}
                                    {s.description && <p>{s.description}</p>}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {visibleStops.length >= 2 && (
                    <Polyline
                        positions={polylinePath}
                        pathOptions={{ color: '#1e40af', weight: 3, opacity: 0.7 }}
                    />
                )}
            </MapContainer>

            <div className={styles.legend}>
                Số trên pin = thứ tự dừng. Click pin để xem chi tiết — hoặc click điểm dừng trong phần lịch trình bên dưới.
                Đường xanh nối các điểm theo thứ tự lộ trình (chỉ minh hoạ thứ tự, không phải đường đi thực).
            </div>
        </div>
    );
};

export default TourRouteMap;
