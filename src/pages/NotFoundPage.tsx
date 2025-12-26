import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <h1 className="error-code">404</h1>
        <div className="divider"></div>
        <h2 className="title">Page Not Found</h2>
        <p className="description">
          The page you are looking for does not exist or has been moved.
        </p>
        
        <button onClick={() => navigate('/')} className="back-button">
          Back to Home
        </button>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} Response Watch
      </footer>

      <style>{`
        .not-found-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
        }

        .not-found-card {
          background: white;
          padding: 40px 60px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          text-align: center;
          max-width: 480px;
          width: 100%;
          border: 1px solid #eaeaea;
        }

        .error-code {
          font-size: 72px;
          font-weight: 800;
          color: #111;
          margin: 0;
          line-height: 1;
          letter-spacing: -2px;
        }

        .divider {
          width: 40px;
          height: 4px;
          background: #000;
          margin: 24px auto;
          border-radius: 2px;
        }

        .title {
          font-size: 24px;
          font-weight: 600;
          color: #111;
          margin: 0 0 12px 0;
        }

        .description {
          font-size: 16px;
          color: #666;
          margin: 0 0 32px 0;
          line-height: 1.5;
        }

        .back-button {
          background: #000;
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .back-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
