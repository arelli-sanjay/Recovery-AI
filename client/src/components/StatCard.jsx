import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  type = "purple",
}) {
  const positive = change >= 0;

  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-top">
        <div className="stat-icon">
          <Icon size={22} />
        </div>

        <span className="stat-title">
          {title}
        </span>
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-bottom">
        <span
          className={
            positive
              ? "change positive"
              : "change negative"
          }
        >
          {positive ? (
            <TrendingUp size={14} />
          ) : (
            <TrendingDown size={14} />
          )}

          {Math.abs(change)}%
        </span>

        <span className="stat-description">
          {description}
        </span>
      </div>

      <div className="stat-sparkline">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}