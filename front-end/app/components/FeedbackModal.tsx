'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquareHeart, Send, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  userEmail?: string;
  userName?: string;
}

const easeOptions = ['Very Easy', 'Moderate', 'Needs Work'] as const;
const qualityOptions = ['Excellent', 'Good', 'Average'] as const;

export default function FeedbackModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  userEmail,
  userName
}: FeedbackModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [easeOfUse, setEaseOfUse] = useState<(typeof easeOptions)[number]>('Very Easy');
  const [platformQuality, setPlatformQuality] = useState<(typeof qualityOptions)[number]>('Excellent');
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(true);
  const [opinion, setOpinion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const isControlled = externalIsOpen !== undefined;
  const showModal = isControlled ? externalIsOpen : internalIsOpen;

  const resetForm = () => {
    setRating(5);
    setHoverRating(0);
    setEaseOfUse('Very Easy');
    setPlatformQuality('Excellent');
    setWouldRecommend(true);
    setOpinion('');
  };

  const handleClose = () => {
    if (externalOnClose) externalOnClose();
    else setInternalIsOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      resetForm();
    }, 280);
  };

  useEffect(() => {
    if (isControlled) return;
    if (localStorage.getItem('bonded_exit_feedback_shown') === 'true') return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        localStorage.setItem('bonded_exit_feedback_shown', 'true');
        setInternalIsOpen(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isControlled]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0 && !opinion.trim()) {
      toast.error('Please share a rating or a brief comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          easeOfUse,
          platformQuality,
          wouldRecommend,
          opinion,
          userEmail,
          userName
        })
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Thank you! Your feedback has been sent.');
        setTimeout(() => {
          setSubmitted(false);
          handleClose();
        }, 2200);
      } else {
        toast.error('Failed to send feedback. Please try again.');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-[22rem] sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-50/50 z-10"
          >
            {/* Header Banner */}
            <div className="relative bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white px-6 pt-6 pb-4">
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[#1363CB]/15 bg-white shadow-sm">
                <MessageSquareHeart className="h-5.5 w-5.5 text-[#1363CB]" />
              </div>

              <div className="mt-3.5 text-center">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Help us improve BondEd
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 mt-1">
                  Your thoughts directly shape our AI platform.
                </p>
              </div>
            </div>

            {/* Form & Success Content */}
            <div className="px-6 pb-6 pt-3">
              {submitted ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <CheckCircle2 className="h-7 w-7 text-[#1363CB]" />
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-slate-800">Feedback received!</h4>
                  <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-slate-500">
                    Sent to the team. We truly appreciate your time and suggestions.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rating Stars */}
                  <div className="space-y-2 text-center">
                    <label className="text-xs font-medium text-slate-500">
                      How would you rate your experience?
                    </label>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none"
                          aria-label={`Rate ${star} out of 5`}
                        >
                          <Star
                            className={`h-6 w-6 transition-colors duration-150 ${(hoverRating || rating) >= star
                              ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                              : 'text-slate-200'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ease of Navigation */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Ease of navigation
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {easeOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setEaseOfUse(option)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${easeOfUse === option
                            ? 'bg-[#1363CB] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Voice & Collaboration Quality */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      AI voice & collaboration quality
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {qualityOptions.map((quality) => (
                        <button
                          key={quality}
                          type="button"
                          onClick={() => setPlatformQuality(quality)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${platformQuality === quality
                            ? 'bg-[#1363CB] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation Toggle */}
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-1.5 border border-slate-100">
                    <span className="pl-2 text-xs font-medium text-slate-600">
                      Would you recommend BondEd?
                    </span>
                    <div className="flex gap-1">
                      {([true, false] as const).map((value) => (
                        <button
                          key={value ? 'yes' : 'no'}
                          type="button"
                          onClick={() => setWouldRecommend(value)}
                          className={`rounded-xl px-3 py-1 text-xs font-medium transition-all ${wouldRecommend === value
                            ? 'bg-[#1363CB] text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-200/60'
                            }`}
                        >
                          {value ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opinion Textarea */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="opinion"
                      className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      What can we do better?
                    </label>
                    <textarea
                      id="opinion"
                      value={opinion}
                      onChange={(e) => setOpinion(e.target.value)}
                      rows={3}
                      placeholder="Tell us what you liked or what improvements you'd love to see..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#1363CB] focus:ring-1 focus:ring-[#1363CB] outline-none transition-all"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Skip for now
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#1363CB] hover:bg-[#1054a8] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Send feedback</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
