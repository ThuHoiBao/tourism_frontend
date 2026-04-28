import React, { useEffect, useState } from 'react';
import styles from './TourCalendar.module.scss';
import { FaChevronLeft, FaChevronRight, FaRegCalendarAlt, FaArrowLeft, FaPlane, FaBus } from 'react-icons/fa';

const TourCalendar = ({departures, onDepartureSelect, selectedDepartureId}) => {
  const [currentMonth, setCurrentMonth] = useState({
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear()
  });

  const [selectedDateData, setSelectedDateData] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    if (selectedDepartureId && calendarData.length > 0) {
      const departure = calendarData.find(dep => dep.departureId === selectedDepartureId);
      if (departure) {
        setSelectedDateData(departure);
        setCurrentMonth({
          month: departure.month,
          year: departure.year
        });
      }
    }
  }, [selectedDepartureId, calendarData]);

  useEffect(() => {
    if(!departures || departures.length === 0) return;

     const monthSet = new Set();
      const processedData = departures.map(dep => {
      const date = new Date(dep.departureDate);
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      monthSet.add(`${m}-${y}`);

      const adultPrice = dep.pricings.find(p => p.passengerType === 'ADULT')?.finalPrice || 0;

      let shortPrice = '';
      if (adultPrice >= 1000000) {
          shortPrice = (adultPrice / 1000000).toFixed(1).replace('.0', '') + 'tr';
      } else {
          shortPrice = (adultPrice / 1000).toFixed(0) + 'k';
      }
      
      return {
        ...dep,
        day: date.getDate(),
        month: m,
        year: y,
        priceDisplay: shortPrice, 
        fullPrice: new Intl.NumberFormat('vi-VN').format(adultPrice) + ' đ'
      };
    });

    setCalendarData(processedData);

    //Convert Set to Array of month-year objects
    const monthsArr = Array.from(monthSet).map(str => {
      const [m, y] = str.split('-');
      return { month: parseInt(m), year: parseInt(y) };
    });

    //Sort months ascending
    monthsArr.sort((a, b) => (a.year - b.year || a.month - b.month));
    setAvailableMonths(monthsArr);

    if(monthsArr.length > 0) {
      setCurrentMonth(monthsArr[0]);
    }
  }, [departures]);


  // Hàm xử lý khi nhấn chọn tháng
  const handleMonthChange = (monthData) => {
    setCurrentMonth(monthData);
    setSelectedDateData(null); 
  };

  const handleDateClick = (depInfo) => {
    if (depInfo) {
      setSelectedDateData(depInfo);
      
      if (onDepartureSelect) {
        onDepartureSelect(depInfo);
      }
    }
  };


  const handleBackToCalendar = () => {
    setSelectedDateData(null); 
  };


  // Hàm kiểm tra ngày có chuyến đi không
  const getDepartureInfo = (day) => {
    return calendarData.find(
      (d) => d.day === day && d.month === currentMonth.month && d.year === currentMonth.year
    );
  };

  // --- LOGIC TÍNH TOÁN LỊCH ---
  // 1. Lấy số ngày trong tháng hiện tại (VD: Tháng 11 có 30 ngày, Tháng 12 có 31 ngày)
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // 2. Lấy thứ của ngày đầu tiên trong tháng (để biết cần chừa bao nhiêu ô trống)
  // JS trả về: 0 (CN), 1 (T2)... 6 (T7).
  // Nhưng lịch mình hiển thị T2 đầu tiên, nên cần map lại: T2=0 ... CN=6
  const getFirstDayOfMonth = (month, year) => {
    const dayIndex = new Date(year, month - 1, 1).getDay();
    return dayIndex === 0 ? 6 : dayIndex - 1;
  };

const renderCalendarDays = () => {
  const days = [];
  const totalDays = getDaysInMonth(currentMonth.month, currentMonth.year);
  const startDayIndex = getFirstDayOfMonth(currentMonth.month, currentMonth.year);

  // Tạo các ô trống đầu tháng
  for (let i = 0; i < startDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
  }
  
  // Tạo các ô ngày chính thức
  for (let i = 1; i <= totalDays; i++) {
    const depInfo = getDepartureInfo(i);
    const isSelected = depInfo && depInfo.departureId === selectedDepartureId;
    
    days.push(
      <div 
        key={i} 
        className={`${styles.dayCell} ${depInfo ? styles.hasTour : ''} ${isSelected ? styles.selected : ''}`} 
        onClick={() => handleDateClick(depInfo)}
      >
        <span className={styles.dateNum}>{i}</span>
        {depInfo && <span className={styles.priceTag}>{depInfo.priceDisplay}</span>}
      </div>
    );
  }
  return days;
};

  const renderDetailView = () => {
    const dep = selectedDateData;
    if(!dep) return null;

    const getPrice = (type) => {
      const p = dep.pricings.find(x => x.passengerType === type);
      return p ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice) : '0 đ';
    };
    const outbound = dep.transports.find(t => t.type === 'OUTBOUND');
    console.log('Outbound transport:', outbound);
    const inbound = dep.transports.find(t => t.type === 'INBOUND');
  
    return (
      <div className={styles.detailViewContainer}>
        {/* Header Chi tiết */}
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={handleBackToCalendar}>
            <FaArrowLeft /> Quay lại
          </button>
          <span className={styles.dateHighlight}>{`${dep.day}/${dep.month}/${dep.year}`}</span>
        </div>

        {/* Phần Phương tiện */}
        <h3 className={styles.sectionHeader}>Phương tiện di chuyển</h3>
        <div className={styles.flightSection}>
        {/* --- CỘT 1: CHIỀU ĐI (OUTBOUND) --- */}
        <div className={styles.flightColumn}>
          {
            outbound ? (
              <>
                <div className={styles.topRow}>
                          <span className={styles.label}>Ngày đi - {new Date(outbound.departTime).toLocaleDateString('vi-VN')}</span>
                          <div className={styles.flightCode}>
                            {outbound.vehicleType === 'PLANE' ? <FaPlane className={styles.icon} /> : <FaBus className={styles.icon} />}
                            {outbound.transportCode}
                          </div>
                        </div>
                        
                        <div className={styles.timeRow}>
                          <span className={styles.time}>{new Date(outbound.departTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</span>
                          <span className={styles.time}>{new Date(outbound.arrivalTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>

                        {/* Thanh Timeline */}
                        <div className={styles.timelineBar}>
                          <div className={styles.dotLeft}></div>
                          <div className={styles.line}></div>
                          <div className={styles.dotRight}></div>
                        </div>

                        <div className={styles.routeInfo}>
                          <span 
                              className={styles.airportCode} 
                              data-tooltip={outbound.startPointName || 'Sân bay'} 
                              title={outbound.startPointName} 
                          >
                            {outbound.startPoint}
                        </span>
                        <span 
                            className={styles.airportCode} 
                            data-tooltip={outbound.endPointName || 'Sân bay'}
                            title={outbound.endPointName}
                        >
                            {outbound.endPoint}
                        </span>
                      </div>
                       <p className={styles.flightInfo}>{outbound.vehicleName}</p>
              </>
            ) : <div className={styles.noInfo}>Đang cập nhập chuyến đi</div>
          }
          </div>
       
        {/* --- CỘT 2: CHIỀU VỀ (INBOUND) --- */}
        <div className={styles.flightColumn}>
          {
            inbound ? (
              <>
                  <div className={styles.topRow}>
                    <span className={styles.label}>Ngày về - {new Date(inbound.departTime).toLocaleDateString('vi-VN')}</span> 
                    <div className={styles.flightCode}>
                      {inbound.vehicleType === 'PLANE' ? <FaPlane className={styles.icon} /> : <FaBus className={styles.icon} />} 
                      {inbound.transportCode}
                    </div>
                   
                  </div>

                  <div className={styles.timeRow}>
                    <span className={styles.time}>{new Date(inbound.departTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</span>
                    <span className={styles.time}>{new Date(inbound.arrivalTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>

                  {/* Thanh Timeline */}
                  <div className={styles.timelineBar}>
                    <div className={styles.dotLeft}></div>
                    <div className={styles.line}></div>
                    <div className={styles.dotRight}></div>
                  </div>

                    <div className={styles.routeInfo}>
                          <span 
                              className={styles.airportCode} 
                              data-tooltip={inbound.startPointName || 'Sân bay'} 
                              title={outbound.startPointName} 
                          >
                            {inbound.startPoint}
                        </span>
                        <span 
                            className={styles.airportCode} 
                            data-tooltip={inbound.endPointName || 'Sân bay'}
                            title={inbound.endPointName}
                        >
                            {inbound.endPoint}
                        </span>
                    </div>
                     <p className={styles.flightInfo}>{inbound.vehicleName}</p>
              </>
            ) : <><div className={styles.noInfo}>Đang cập nhập chuyến về</div></>
          }
          </div>
        </div>

        {/* Phần Giá */}
        <h3 className={styles.sectionHeader}>Giá</h3>
        <div className={styles.pricingGrid}>
          <div className={styles.priceRow}>
            <span className={styles.label}>Người lớn <small>(Từ 11 tuổi trở lên)</small></span>
            <span className={styles.value}>{getPrice('ADULT')}</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.label}>Em bé <small>(Dưới 2 tuổi)</small></span>
            <span className={styles.value}>{getPrice('INFANT')}</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.label}>Trẻ em <small>(Từ 5 đến 11 tuổi)</small></span>
            <span className={styles.value}>{getPrice('CHILD')}</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.label}>Phụ thu phòng đơn</span>
            <span className={styles.value}>{getPrice('SINGLE_SUPPLEMENT')}</span>
          </div>
        </div>

        <div className={styles.warningBox}>
           Liên hệ tổng đài tư vấn: 1900 1808... Cơ cấu khách sạn phòng 1 giường đôi hoặc 2 giường đơn tùy tình hình thực tế...
        </div>
      </div>
    );
  };

  // -- LƯỚI LỊCH (CALENDAR GRID) ---
  const renderCalendarView = () => {
    return (
      <>
        <div className={styles.calendarHeader}>
          <FaChevronLeft className={styles.navIcon} />
          <span className={styles.currentMonthTitle}>
              THÁNG {currentMonth.month}/{currentMonth.year}
          </span>
          <FaChevronRight className={styles.navIcon} />
        </div>

        <div className={styles.weekDays}>
          <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span>
          <span className={styles.weekend}>T7</span><span className={styles.weekend}>CN</span>
        </div>

        <div className={styles.daysGrid}>
          {renderCalendarDays()} {/* Gọi hàm sinh ô ngày ở đây */}
        </div>
        
        <p className={styles.note}>Quý khách vui lòng chọn ngày phù hợp</p>
      </>
    );
  };

return (
    <div className={styles.calendarContainer}>
      <h2 className={styles.sectionTitle}>LỊCH KHỞI HÀNH</h2>
      
      <div className={styles.calendarWrapper}>
        {/* CỘT 1: CHỌN THÁNG */}
        <div className={styles.monthSelector}>
          <h3>Chọn tháng</h3>
          {availableMonths.map((item, index) => (
            <button
              key={index}
              className={`${styles.monthBtn} ${
                item.month === currentMonth.month && item.year === currentMonth.year 
                ? styles.active 
                : ''
              }`}
              onClick={() => handleMonthChange(item)}
            >
              {item.month}/{item.year}
            </button>
          ))}
        </div>

        {/* CỘT 2: HIỂN THỊ LINH HOẠT (SỬA Ở ĐÂY) */}
        <div className={styles.calendarGridArea}>
          {/* Nếu selectedDateData có dữ liệu -> Hiện chi tiết. Ngược lại -> Hiện lịch */}
          {selectedDateData ? renderDetailView() : renderCalendarView()}
        </div>
      </div>
    </div>
  );
}
export default TourCalendar;