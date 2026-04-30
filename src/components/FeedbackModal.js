"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { submitFeedback } from "@/lib/firestore";

export default function FeedbackModal({ isOpen, onClose }) {
  const { user, userProfile } = useAuth();
  const { showNotification } = useNotification();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await submitFeedback(user.uid, {
        rating,
        comment,
        userName: userProfile?.displayName || user.email,
        userEmail: user.email,
        createdAt: new Date().toISOString()
      });
      showNotification("Geri bildiriminiz için teşekkürler!", "success");
      setComment("");
      setRating(5);
      onClose();
    } catch (error) {
      console.error(error);
      showNotification("Bir hata oluştu, lütfen tekrar deneyin.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-card animate-pop" onClick={e => e.stopPropagation()}>
        <button className="feedback-close" onClick={onClose}>✕</button>
        
        <div className="feedback-header">
          <div className="feedback-icon-bg">
            <i className="fa-solid fa-comments"></i>
          </div>
          <h2>Geri Bildirim</h2>
          <p>YDT Focus'u geliştirmemize yardımcı olun. Fikirleriniz bizim için çok değerli.</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (hover || rating) ? "active" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <i className={`fa-${star <= (hover || rating) ? "solid" : "regular"} fa-star`}></i>
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Görüşlerinizi, önerilerinizi veya yaşadığınız sorunları buraya yazabilirsiniz..."
            required
            className="feedback-textarea"
          ></textarea>

          <button 
            type="submit" 
            className="feedback-submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="btn-spinner"></div>
                Gönderiliyor...
              </>
            ) : "Gönder"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .feedback-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .feedback-card {
          background: #1c1c1e;
          width: 100%;
          max-width: 440px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 40px;
          position: relative;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
        }

        .feedback-close {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #888;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }

        .feedback-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .feedback-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .feedback-icon-bg {
          width: 64px;
          height: 64px;
          background: rgba(255, 214, 10, 0.1);
          color: var(--accent);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin: 0 auto 20px;
        }

        .feedback-header h2 {
          font-size: 1.6rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 8px;
        }

        .feedback-header p {
          color: #86868b;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .star-rating {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .star-btn {
          background: transparent;
          border: none;
          font-size: 2.2rem;
          color: #3a3a3c;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .star-btn.active {
          color: var(--accent);
        }

        .star-btn:hover {
          transform: scale(1.2);
        }

        .feedback-textarea {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 20px;
          color: #fff;
          font-size: 1rem;
          min-height: 120px;
          resize: none;
          transition: all 0.2s;
        }

        .feedback-textarea:focus {
          outline: none;
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.05);
        }

        .feedback-submit-btn {
          background: var(--accent);
          color: #000;
          border: none;
          padding: 18px;
          border-radius: 18px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(255, 214, 10, 0.2);
        }

        .feedback-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .feedback-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-pop {
          animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes pop {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 480px) {
          .feedback-card {
            padding: 30px 24px;
          }
          .star-btn {
            font-size: 1.8rem;
          }
        }

        @media (max-height: 600px) {
          .feedback-card {
            padding: 24px;
            max-height: 95vh;
            overflow-y: auto;
          }
          .feedback-header { margin-bottom: 16px; }
          .feedback-icon-bg { width: 48px; height: 48px; font-size: 1.2rem; margin-bottom: 12px; }
          .feedback-header h2 { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}
