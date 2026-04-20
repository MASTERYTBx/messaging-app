import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState(null);

  const showAlert = (message) => {
    setAlertState({ message, isConfirm: false });
  };

  const showConfirm = (message, onConfirm) => {
    setAlertState({ message, isConfirm: true, onConfirm });
  };

  const closeAlert = () => setAlertState(null);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AnimatePresence>
        {alertState && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <motion.div 
              className="profile-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ maxWidth: '350px', padding: '24px' }}
            >
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                {alertState.isConfirm ? 'Confirm Action' : 'Notice'}
              </h3>
              <p style={{ margin: '16px 0', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {alertState.message}
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  onClick={closeAlert}
                  style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                >
                  {alertState.isConfirm ? 'Cancel' : 'OK'}
                </button>
                {alertState.isConfirm && (
                  <button 
                    onClick={() => { alertState.onConfirm(); closeAlert(); }}
                    style={{ padding: '8px 16px', background: 'var(--primary-color)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Confirm
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};
