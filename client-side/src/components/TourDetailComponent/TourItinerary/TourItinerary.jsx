import React, { useEffect, useRef, useState } from 'react';
import styles from './TourItinerary.module.scss';
import { FaChevronDown, FaUtensils } from 'react-icons/fa';
import { MapPin } from 'lucide-react';

const TourItinerary = ({ itinerary, combined, highlightedStop, onStopClick }) => {
  const [openDays, setOpenDays] = useState(new Set());
  const stopRefs = useRef({});

  // Ưu tiên combined (có stops khớp map); fallback itinerary plain.
  const days = combined?.days?.length > 0 ? combined.days : (itinerary || []);
  const isCombined = combined?.days?.length > 0;

  // Chỉ phản ứng khi nguồn highlight là MAP (user click pin) → mở day + scroll tới row.
  // Nếu nguồn là chính itinerary (user click row) → bỏ qua, để map tự scroll lên.
  useEffect(() => {
    if (!highlightedStop || !isCombined) return;
    if (highlightedStop._source !== 'map') return;
    const dayIdx = days.findIndex(d =>
      d.stops?.some(s => s.stopId === highlightedStop.stopId));
    if (dayIdx === -1) return;
    setOpenDays(prev => new Set(prev).add(dayIdx));
    setTimeout(() => {
      const el = stopRefs.current[highlightedStop.stopId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
  }, [highlightedStop, isCombined, days]);

  if (!days || days.length === 0) {
    return <div className={styles.emptyData}>Đang cập nhật lịch trình...</div>;
  }

  const toggleAccordion = (index) => {
    setOpenDays(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className={styles.itineraryContainer}>
      <h2 className={styles.sectionTitle}>LỊCH TRÌNH</h2>

      <div className={styles.listWrapper}>
        {days.map((item, index) => {
          const isOpen = openDays.has(index);
          const dayColor = item.color || '#1e40af';
          const stops = item.stops || [];

          return (
            <div key={item.itineraryDayId || index}
                 className={`${styles.dayItem} ${isOpen ? styles.active : ''}`}>

              <div className={styles.dayHeader} onClick={() => toggleAccordion(index)}>
                <div className={styles.headerContent}>
                  <div className={styles.mainTitle}>
                    Ngày {item.dayNumber}: {item.title}
                  </div>

                  {/* Auto subtitle từ stops — chỉ khi có combined */}
                  {item.autoSubtitle && (
                    <div className={styles.autoSubtitle} style={{ color: dayColor }}>
                      <MapPin size={11} /> {item.autoSubtitle}
                    </div>
                  )}

                  {item.meals && (
                    <div className={styles.subInfo}>
                      <FaUtensils className={styles.icon} /> {item.meals}
                    </div>
                  )}
                </div>

                <div className={`${styles.arrowIcon} ${isOpen ? styles.rotate : ''}`}>
                  <FaChevronDown />
                </div>
              </div>

              <div className={`${styles.dayBody} ${isOpen ? styles.open : ''}`}>
                <div className={styles.bodyInner}>

                  {/* Block điểm dừng (chỉ khi có combined) */}
                  {isCombined && stops.length > 0 && (
                    <div className={styles.stopList}>
                      <h5 className={styles.stopListTitle}>
                        <MapPin size={13} /> Điểm dừng trong ngày ({stops.length})
                      </h5>
                      {stops.map(stop => {
                        const isHighlighted = highlightedStop?.stopId === stop.stopId;
                        return (
                          <button
                            key={stop.stopId}
                            ref={el => { stopRefs.current[stop.stopId] = el; }}
                            type="button"
                            className={`${styles.stopRow} ${isHighlighted ? styles.stopRowActive : ''}`}
                            onClick={() => onStopClick?.({
                              ...stop,
                              dayNumber: item.dayNumber,
                            })}
                            title="Xem trên bản đồ"
                          >
                            <span className={styles.stopBadge}
                                  style={{ background: dayColor }}>
                              {stop.globalIndex}
                            </span>
                            <div className={styles.stopMeta}>
                              <strong>{stop.name}</strong>
                              {stop.description &&
                                <span className={styles.stopDesc}>{stop.description}</span>}
                            </div>
                            <span className={styles.stopJump}>Xem map →</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className={styles.bodyContent}>
                    <div dangerouslySetInnerHTML={{ __html: item.details }} />
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TourItinerary;
