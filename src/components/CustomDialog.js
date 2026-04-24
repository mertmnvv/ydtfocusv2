"use client";

import React from "react";

export default function CustomDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="custom-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{title}</h3>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn-cancel" onClick={onCancel}>İptal</button>
          <button className="dialog-btn-confirm" onClick={onConfirm}>Evet, Eminim</button>
        </div>
      </div>
    </div>
  );
}
