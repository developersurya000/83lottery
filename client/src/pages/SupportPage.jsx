import { useState } from "react";

function SupportPage({ user }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !message) {
      alert("Please fill subject and message");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      console.log("Support Ticket:", { user: user.phone, subject, message });
      setSuccess(true);
      setLoading(false);
      setSubject("");
      setMessage("");
    }, 1500);
  };

  return (
    <div className="support-page">
      <div className="support-card">
        <h3>Customer Support</h3>
        <p>Submit your issue/query below</p>

        {success ? (
          <div className="success-message">
            ✅ Ticket submitted successfully!
            <br />
            We will contact you within 24 hours
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="support-form">
            <div className="input-group">
              <label>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Withdrawal issue / Game problem etc."
                className="support-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue..."
                rows="5"
                className="support-textarea"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="support-submit-btn"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        )}
      </div>
      {/* Animated page dots under the form */}
      <div className="page-dots">
        <div className="page-dot active"></div>
        <div className="page-dot"></div>
        <div className="page-dot"></div>
      </div>
    </div>
  );
}

export default SupportPage;
