import React, { useEffect, useMemo, useState } from 'react';
import styles from './LocationDropdown.module.scss';
import { getEndLocationsApi } from '../../../services/location/location.ts';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=60';

const normalizeText = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const LocationDropdown = ({ query, onSelect, onClose }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const data = await getEndLocationsApi();
        if (isMounted) {
          setLocations(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Không thể tải danh sách điểm đến.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLocations();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLocations = useMemo(() => {
    if (!query.trim()) {
      return locations.slice(0, 8);
    }

    const normalizedQuery = normalizeText(query);

    return locations.filter((location) =>
      normalizeText(location.name).includes(normalizedQuery)
    );
  }, [locations, query]);

  const handleSelect = (location) => {
    onSelect(location);
    onClose();
  };

  return (
    <div className={styles.dropdownWrapper}>
      <div className={styles.dropdownHeader}>
        <div>
          <p className={styles.title}>Điểm đến ({filteredLocations.length})</p>
          {query && <span className={styles.keyword}>Từ khóa: {query}</span>}
        </div>
        <button className={styles.closeButton} type="button" onMouseDown={onClose}>
          ×
        </button>
      </div>

      {loading && <p className={styles.helperText}>Đang tải điểm đến...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      <ul className={styles.locationList}>
        {filteredLocations.map((location) => (
          <li
            key={location.locationID}
            className={styles.locationItem}
            onMouseDown={() => handleSelect(location)}
          >
            <img src={location.imageUrl || DEFAULT_IMAGE} alt={location.name} />
            <div>
              <p className={styles.locationName}>{location.name}</p>
              {location.description && (
                <p className={styles.locationDescription} title={location.description}>
                  {location.description}
                </p>
              )}
            </div>
          </li>
        ))}

        {!loading && !filteredLocations.length && (
          <li className={styles.emptyState}>Không tìm thấy điểm đến phù hợp.</li>
        )}
      </ul>
    </div>
  );
};

export default LocationDropdown;

