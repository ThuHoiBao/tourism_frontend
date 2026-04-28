import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { IMaskInput } from 'react-imask'; 
import { FaCalendarAlt } from 'react-icons/fa';
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth } from 'date-fns';
import range from "lodash/range";

import styles from './DateInput.module.scss';

const DateInput = ({ value, onChange, type }) => {
  
  const validateAge = (date) => {
    if (!date) return true;
    
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    if (type === 'adult' && age < 12) return false;
    if (type === 'child' && (age < 5 || age >= 12)) return false;
    if (type === 'toddler' && (age < 2 || age >= 5)) return false;
    if (type === 'infant' && age >= 2) return false;

    return true;
  };

  const CustomInput = forwardRef(({ value, onClick, onChange, className }, ref) => {
    return (
      <div className={styles.inputWrapper}>
        <IMaskInput
          mask="00/00/0000" 
          definitions={{
            '0': /[0-9]/
          }}
          inputRef={ref} 
          value={value}
          
          onAccept={(value) => onChange({ target: { value } })} 
          
          onClick={onClick}
          placeholder="dd/mm/yyyy"
          className={`${styles.inputField} ${className}`} 
        />
        <FaCalendarAlt className={styles.icon} onClick={onClick} />
      </div>
    );
  });

  const handleDateChange = (date) => {
    if (date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        onChange(`${day}/${month}/${year}`);
    }
  };

  const handleManualChange = (e) => {
     onChange(e.target.value);
  };

  const getSelectedDate = () => {
      if (!value || value.includes('_') || value.length < 10) return null;
      const [day, month, year] = value.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      return isNaN(date.getTime()) ? null : date;
  };

  const renderCustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => {
    const years = range(1900, new Date().getFullYear() + 1, 1);
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
    ];

    return (
      <div className={styles.calendarHeader}>
        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>{"<"}</button>
        <select value={getYear(date)} onChange={({ target: { value } }) => changeYear(value)}>
          {years.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select value={months[getMonth(date)]} onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}>
          {months.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>{">"}</button>
      </div>
    );
  };

  const isValid = validateAge(getSelectedDate());

  return (
    <div className={styles.container}>
      <DatePicker
        selected={getSelectedDate()}
        onChange={handleDateChange}
        customInput={<CustomInput onChange={handleManualChange} />}
        dateFormat="dd/MM/yyyy"
        renderCustomHeader={renderCustomHeader}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        placeholderText="dd/mm/yyyy"
        maxDate={new Date()} 
        className={!isValid ? styles.error : ''}
      />
      {!isValid && <span className={styles.errorMessage}>Độ tuổi không phù hợp</span>}
    </div>
  );
};

export default DateInput;