import { useState } from 'react';
import { Link } from 'react-router';
import styles from './Legal.module.css';

type Status = 'idle' | 'sending' | 'ok' | 'error';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('order');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@') || !message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      });
      setStatus(res.ok ? 'ok' : 'error');
      if (res.ok) {
        setName('');
        setEmail('');
        setMessage('');
        setTopic('order');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.title}>contact</div>
      <div className={styles.updated}>email replies within one business day</div>

      <div className={styles.section}>
        <p className={styles.p}>
          email us directly at{' '}
          <a href="mailto:hello@internetfc.com" style={{ color: 'var(--bright)' }}>hello@internetfc.com</a>,
          or use the form below. we read every message.
        </p>
      </div>

      <form className={styles.contactForm} onSubmit={onSubmit}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="optional"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="you@email.com"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>topic</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={styles.input}
          >
            <option value="order">order status</option>
            <option value="return">returns &amp; exchanges</option>
            <option value="defect">printing defect</option>
            <option value="bulk">bulk &amp; team orders</option>
            <option value="press">press &amp; partnerships</option>
            <option value="other">something else</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>message</span>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className={styles.textarea}
            placeholder="how can we help?"
          />
        </label>

        <div className={styles.contactActions}>
          <button
            type="submit"
            className={styles.cta}
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'sending...' : 'send message'}
          </button>
          {status === 'ok' && (
            <span style={{ color: 'var(--green)', fontSize: 13 }}>
              &check; got it. we&rsquo;ll reply within a business day.
            </span>
          )}
          {status === 'error' && (
            <span style={{ color: 'var(--green)', fontSize: 13 }}>
              email is faster: hello@internetfc.com
            </span>
          )}
        </div>
      </form>

      <Link to="/" className={styles.back}>&larr; back to home</Link>
    </div>
  );
}
