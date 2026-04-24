"use client";

import React from "react";

export default function Notification({ message, type, onClose }) {
  const getIcon = () => {
    switch (type) {
      case "success": return "fa-circle-check";
      case "error": return "fa-circle-xmark";
      case "warning": return "fa-triangle-exclamation";
      default: return "fa-circle-info";
    }
  };

  return (
    <div className={`custom-notification ${type}`} onClick={onClose}>
      <div className="notification-icon">
        <i className={`fa-solid ${getIcon()}`}></i>
      </div>
      <div className="notification-content">
        {message}
      </div>
      <button className="notification-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        <i className="fa-solid fa-xmark"></i>
      </button>
      <div className="notification-progress"></div>
    </div>
  );
}
