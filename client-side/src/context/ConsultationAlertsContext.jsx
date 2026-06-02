import React, { createContext, useContext } from 'react';
import useConsultationAlerts from '../hook/useConsultationAlerts';

const ConsultationAlertsContext = createContext(null);

export const ConsultationAlertsProvider = ({ children }) => {
    const value = useConsultationAlerts();
    return (
        <ConsultationAlertsContext.Provider value={value}>
            {children}
        </ConsultationAlertsContext.Provider>
    );
};

export const useConsultationAlertsContext = () => {
    const ctx = useContext(ConsultationAlertsContext);
    if (!ctx) {
        // Fallback an toàn nếu component được render ngoài Provider
        return {
            pendingCount: 0,
            unseenItems: [],
            pendingItems: [],
            unseenCount: 0,
            clearUnseen: () => {},
            refreshPendingCount: () => {},
        };
    }
    return ctx;
};
