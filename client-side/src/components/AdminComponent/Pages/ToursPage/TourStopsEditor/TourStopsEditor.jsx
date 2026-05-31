import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'react-toastify';
import { Plus, Trash2, MapPin, Save, ArrowLeft, Calendar, GripVertical } from 'lucide-react';
import tourRouteApi from '../../../../../services/tour/tourRouteApi';
import styles from './TourStopsEditor.module.scss';

const STOP_TYPES = [
    { value: 'ATTRACTION', label: 'Tham quan',     color: '#1e40af' },
    { value: 'HOTEL',      label: 'Khách sạn',     color: '#7c3aed' },
    { value: 'RESTAURANT', label: 'Nhà hàng',      color: '#d97706' },
    { value: 'TRANSPORT',  label: 'Di chuyển',     color: '#0891b2' },
    { value: 'START',      label: 'Điểm bắt đầu',  color: '#059669' },
    { value: 'END',        label: 'Điểm kết thúc', color: '#dc2626' },
];

const DAY_COLORS = ['#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2'];
const VN_CENTER = [16.0, 108.0];

const ClickToPin = ({ enabled, onPick }) => {
    useMapEvents({
        click: (e) => { if (enabled) onPick(e.latlng.lat, e.latlng.lng); },
    });
    return null;
};

const FitToStops = ({ stops, trigger }) => {
    const map = useMap();
    useEffect(() => {
        const valid = stops.filter(s => s.latitude && s.longitude);
        if (valid.length === 0) return;
        if (valid.length === 1) {
            map.setView([valid[0].latitude, valid[0].longitude], 12);
            return;
        }
        const bounds = L.latLngBounds(valid.map(s => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [50, 50] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger]);
    return null;
};

const makeIcon = (idx, color, active) => L.divIcon({
    className: styles.markerWrap,
    html: `<div class="${styles.markerPin} ${active ? styles.markerActive : ''}" style="background:${color}">
             <span>${idx + 1}</span>
           </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
});

let tempIdCounter = 0;

const TourStopsEditor = () => {
    const { tourId } = useParams();
    const [stops, setStops] = useState([]);
    const [activeIdx, setActiveIdx] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fitTrigger, setFitTrigger] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await tourRouteApi.getStops(tourId);
            setStops((data || []).map(s => ({
                tempId: ++tempIdCounter,
                stopId: s.stopId,
                name: s.name || '',
                latitude: s.latitude,
                longitude: s.longitude,
                stopOrder: s.stopOrder,
                description: s.description || '',
                stopType: s.stopType || 'ATTRACTION',
                dayNumber: s.dayNumber,
            })));
            setFitTrigger(t => t + 1);
        } catch {
            toast.error('Không tải được danh sách điểm dừng');
        } finally {
            setLoading(false);
        }
    }, [tourId]);

    useEffect(() => { load(); }, [load]);

    const addStop = () => {
        const newIdx = stops.length;
        setStops(prev => [...prev, {
            tempId: ++tempIdCounter,
            name: '',
            latitude: null,
            longitude: null,
            stopOrder: newIdx + 1,
            description: '',
            stopType: 'ATTRACTION',
            dayNumber: 1,
        }]);
        setActiveIdx(newIdx);
    };

    const updateStop = (idx, patch) => {
        setStops(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
    };

    const removeStop = (idx) => {
        setStops(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stopOrder: i + 1 })));
        if (activeIdx === idx) setActiveIdx(null);
        else if (activeIdx > idx) setActiveIdx(activeIdx - 1);
    };

    const handleMapClick = (lat, lng) => {
        if (activeIdx == null) {
            toast.info('Hãy bấm vào 1 thẻ trong cột trái trước, rồi click bản đồ');
            return;
        }
        updateStop(activeIdx, {
            latitude: Math.round(lat * 1000000) / 1000000,
            longitude: Math.round(lng * 1000000) / 1000000,
        });
    };

    const handlePasteCoords = (e, idx) => {
        const text = e.clipboardData.getData('text');
        const match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (match) {
            e.preventDefault();
            updateStop(idx, {
                latitude: parseFloat(match[1]),
                longitude: parseFloat(match[2]),
            });
            toast.success('Đã gán toạ độ');
        }
    };

    const save = async () => {
        for (let i = 0; i < stops.length; i++) {
            const s = stops[i];
            if (!s.name?.trim())    { toast.error(`Điểm #${i + 1}: chưa có tên`); return; }
            if (s.latitude == null) { toast.error(`Điểm #${i + 1}: chưa có lat`); return; }
            if (s.longitude == null){ toast.error(`Điểm #${i + 1}: chưa có lng`); return; }
            if (s.latitude < -90 || s.latitude > 90)    { toast.error(`#${i + 1}: lat ngoài [-90,90]`); return; }
            if (s.longitude < -180 || s.longitude > 180){ toast.error(`#${i + 1}: lng ngoài [-180,180]`); return; }
        }

        setSaving(true);
        try {
            const payload = stops.map((s, i) => ({
                name: s.name.trim(),
                latitude: s.latitude,
                longitude: s.longitude,
                stopOrder: i + 1,
                description: s.description?.trim() || null,
                stopType: s.stopType || 'ATTRACTION',
                dayNumber: s.dayNumber || null,
            }));
            await tourRouteApi.upsertStops(tourId, payload);
            toast.success(`Đã lưu ${payload.length} điểm dừng`);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Lưu thất bại');
        } finally { setSaving(false); }
    };

    const mapCenter = useMemo(() => {
        const valid = stops.find(s => s.latitude && s.longitude);
        return valid ? [valid.latitude, valid.longitude] : VN_CENTER;
    }, [stops]);

    const getStopColor = (s) => {
        if (s.dayNumber) return DAY_COLORS[(s.dayNumber - 1) % DAY_COLORS.length];
        const t = STOP_TYPES.find(x => x.value === s.stopType);
        return t?.color || '#64748b';
    };

    const validStops = stops.filter(s => s.latitude && s.longitude);

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <Link to="/admin/tours" className={styles.backLink}>
                    <ArrowLeft size={15} /> Quay về danh sách tour
                </Link>
                <div className={styles.headerActions}>
                    <button className={styles.btnAdd} onClick={addStop}>
                        <Plus size={14} /> Thêm điểm
                    </button>
                    <button className={styles.btnSave} onClick={save} disabled={saving}>
                        <Save size={14} /> {saving ? 'Đang lưu…' : `Lưu (${stops.length})`}
                    </button>
                </div>
            </div>

            <div className={styles.titleRow}>
                <h1 className={styles.title}>
                    <MapPin size={20} /> Bản đồ lộ trình tour #{tourId}
                </h1>
                <p className={styles.subtitle}>
                    Bấm vào 1 thẻ điểm dừng → click vị trí trên bản đồ để gán toạ độ.
                    Hoặc paste cặp số "lat, lng" copy từ Google Maps vào ô Lat.
                </p>
            </div>

            <div className={styles.body}>
                {/* CỘT TRÁI: list cards */}
                <div className={styles.listPanel}>
                    {loading ? (
                        <div className={styles.empty}>Đang tải…</div>
                    ) : stops.length === 0 ? (
                        <div className={styles.empty}>
                            <MapPin size={32} strokeWidth={1.5} />
                            <p>Tour này chưa có điểm dừng nào</p>
                            <button className={styles.btnAdd} onClick={addStop}>
                                <Plus size={14} /> Thêm điểm đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className={styles.cardList}>
                            {stops.map((s, idx) => {
                                const color = getStopColor(s);
                                const active = activeIdx === idx;
                                const hasCoord = s.latitude != null && s.longitude != null;
                                return (
                                    <div key={s.tempId}
                                         className={`${styles.card} ${active ? styles.cardActive : ''}`}
                                         onClick={() => setActiveIdx(idx)}>
                                        <div className={styles.cardHead}>
                                            <span className={styles.badge} style={{ background: color }}>
                                                {idx + 1}
                                            </span>
                                            <input className={styles.inputName}
                                                value={s.name}
                                                placeholder="Tên điểm dừng (vd: Vịnh Hạ Long)"
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => updateStop(idx, { name: e.target.value })} />
                                            <button className={styles.btnDel}
                                                title="Xóa điểm này"
                                                onClick={(e) => { e.stopPropagation(); removeStop(idx); }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className={styles.cardRow}>
                                            <div className={styles.field}>
                                                <label>Lat</label>
                                                <input className={`${styles.input} ${!hasCoord ? styles.inputWarn : ''}`}
                                                    type="number" step="any"
                                                    value={s.latitude ?? ''}
                                                    placeholder="20.910"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onPaste={(e) => handlePasteCoords(e, idx)}
                                                    onChange={(e) => updateStop(idx, {
                                                        latitude: e.target.value === '' ? null : parseFloat(e.target.value)
                                                    })} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Lng</label>
                                                <input className={`${styles.input} ${!hasCoord ? styles.inputWarn : ''}`}
                                                    type="number" step="any"
                                                    value={s.longitude ?? ''}
                                                    placeholder="107.184"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onPaste={(e) => handlePasteCoords(e, idx)}
                                                    onChange={(e) => updateStop(idx, {
                                                        longitude: e.target.value === '' ? null : parseFloat(e.target.value)
                                                    })} />
                                            </div>
                                            <div className={styles.field}>
                                                <label><Calendar size={11} /> Ngày</label>
                                                <input className={styles.input}
                                                    type="number" min="1" max="30"
                                                    value={s.dayNumber ?? ''}
                                                    placeholder="1"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => updateStop(idx, {
                                                        dayNumber: e.target.value === '' ? null : parseInt(e.target.value),
                                                    })} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Loại</label>
                                                <select className={styles.input}
                                                    value={s.stopType}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => updateStop(idx, { stopType: e.target.value })}>
                                                    {STOP_TYPES.map(t =>
                                                        <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className={styles.cardRow}>
                                            <div className={styles.fieldFull}>
                                                <label>Mô tả ngắn</label>
                                                <input className={styles.input}
                                                    value={s.description}
                                                    placeholder="Hang động lớn nhất vịnh Hạ Long..."
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => updateStop(idx, { description: e.target.value })} />
                                            </div>
                                        </div>

                                        {active && (
                                            <div className={styles.activeHint}>
                                                👆 Click vị trí trên bản đồ để gán toạ độ
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: map */}
                <div className={styles.mapPanel}>
                    <div className={styles.mapBar}>
                        <span className={styles.mapCount}>
                            <MapPin size={13} /> {validStops.length}/{stops.length} điểm có toạ độ
                        </span>
                        {activeIdx != null && (
                            <span className={styles.mapActive}>
                                Đang chọn: <strong>#{activeIdx + 1} {stops[activeIdx]?.name || '(chưa đặt tên)'}</strong>
                            </span>
                        )}
                    </div>
                    <MapContainer center={mapCenter} zoom={6} scrollWheelZoom={true}
                                  className={styles.map}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19} />
                        <ClickToPin enabled={activeIdx != null} onPick={handleMapClick} />
                        <FitToStops stops={stops} trigger={fitTrigger} />
                        {stops.map((s, realIdx) => {
                            if (!s.latitude || !s.longitude) return null;
                            return (
                                <Marker key={s.tempId}
                                    position={[s.latitude, s.longitude]}
                                    icon={makeIcon(realIdx, getStopColor(s), realIdx === activeIdx)}
                                    eventHandlers={{ click: () => setActiveIdx(realIdx) }} />
                            );
                        })}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default TourStopsEditor;
